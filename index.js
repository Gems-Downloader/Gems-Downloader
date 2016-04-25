const exec = require('child_process').exec;
const cheerio = require('cheerio');
const https = require('https');
const http = require('http');
const async = require('async');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const _ = require('underscore');


https.globalAgent.maxSockets = Infinity;
http.globalAgent.maxSockets = Infinity;

var getRubyGemsIndex = function (callback) {
  console.log('Creating RubyGems Index.');
  console.log("Calling: gem search '^(.*)$' --all");
  return exec("gem search '^(.*)$' --all",
    {
      maxBuffer: 20 * 1024 * 1024,
      encoding: 'utf8'
    },
    (error, stdout, stderr) => {
      console.log('Finished creating RubyGems Index.');

      if (error) {
        console.log('An ERROR accured while creating RubyGems Index:');
        console.log(error);
        callback();
      }

      callback(getGemNames(stdout.toString()));
    }
  );
}

var getGemNames = function (gemList) {
  if (!gemList) {
    return;
  }

  var gemListLines = gemList.split('\n');

  result = [];
  for (i = 0; i < gemListLines.length; i++) {
    // Add Async.each
    var gemNameRegex = /(.+) \(.*\)/igm;
    var regexResult = gemNameRegex.exec(gemListLines[i]);
    if (!regexResult) {
      continue;
    }
    result.push(regexResult[1]);
  }
  return result;
}

var getGemVersions = function (gemName, callback) {
  result = [];
  var gemVersionsURL = `https://rubygems.org/gems/${gemName}/versions/`;
  getHTML(gemVersionsURL, (versionsPageHtml) => {
    if (!versionsPageHtml) {
      return callback();
    }
    var vesrionsPage = cheerio(versionsPageHtml);
    var versionHyperlinks = _.map(vesrionsPage.find('.gem__version-wrap'), (gemWarp) => {
      gemWarp = cheerio(gemWarp);
      var versionItem = gemWarp.find('.t-list__item')[0];
      var url = versionItem.attribs.href;
      var version = cheerio(versionItem).text();
      var date = new Date(gemWarp.find('small.gem__version__date').text());
      var gemSize = cheerio(gemWarp.find("span[class='gem__version__date']")[0]).text().trim().replace("(","").replace(")","");
      var isYanked = gemWarp.find("span:contains('yanked')").length > 0;

      var result = {
        version: version,
        url: url,
        size: gemSize,
        date: date,
        yanked: isYanked
      };

      var platform = gemWarp.find('.platform')[0];
      if (platform) {
        result.platform = cheerio(platform).text().trim();
      }

      return result;
    });

    var result = _.map(versionHyperlinks, (versionHyperLink, index) => {
      return _.extend({
        name: gemName
      }, versionHyperLink);
    });
    callback(result);
  });
}

var getGemDetails = function (gemVersionObject, callback) {
    getHTML(gemVersionObject.url, (versionPageHTML) => {
      if (!versionPageHTML) {
        return callback();
      }
      var versionPage = cheerio(versionPageHTML);
      var description = cheerio(versionPage.find('#markup')).text().trim();
      var sha = versionPage.find('.gem__sha').text().trim();
      var gemDetails = _.extend(gemVersionObject, {
        sha: sha,
        description: description
      });

      callback(gemDetails);
    });
  };

var getHTML = function (url, callback) {
  https.get(url, (res) => {

    if (res.statusCode != 200) {
      console.log('url: ', url);
      console.log('statusCode: ', res.statusCode);
      return callback();
    }

    var html = "";

    res.on('data', (data) => {
      html += data;
    });

    res.on('end', () => {
      callback(html);
    });


  }).on('error', (e) => {
    console.error(`error in ${url}: `, e);
    callback();
  });
}

var getId = function (gemDetails) {
  var _id = `${gemDetails.name}-${gemDetails.version}`;
  if (gemDetails.platform) {
    _id = `${_id}-${gemDetails.platform}`;
  }
  return _id;
}

getRubyGemsIndex((gems) => {
  var url = 'mongodb://localhost:27017/gem_index';
  mongoClient.connect(url, function(err, db) {
    console.log("Connected correctly to server.");
    async.forEachOfLimit(gems, 15, (gem, index, versionNext) => {
      getGemVersions(gem, (versions) => {
        async.forEachOfLimit(versions, 1, (version, index, versionDetailsNext) => {
          if (!version || version.yanked) {
            return versionDetailsNext();
          }
          var _id = getId(version);
          db.collection('gems').findOne({ _id: _id }, (err, result) => {
            if (err) {
              console.error('error: ', err);
              return versionDetailsNext();
            }
            if (result) {
              return versionDetailsNext();
            }
            getGemDetails(version, (details) => {
              if (!details) {
                return versionDetailsNext();
              }
              details._id = _id;
              delete details.yanked;
              db.collection('gems').insert(details, (err, result) => {
                if (err) {
                  console.error(err);
                }
                return versionDetailsNext();
              });
            });
          });
        }, (err) => {
          if (err) {
            console.error('error: ', err)
          }
          versionNext();
        });
      });
    }, (err) => {
      if (err) {
        console.error('error: ', err)
      }
    });
  });
});
