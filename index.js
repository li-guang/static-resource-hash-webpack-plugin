/*
* V1.0.2
* By LiGuang
* */

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var crypto = require('crypto');

var hashFileObjects = [];
var filePatterns = [
  /(url\s*\( *)([^:\*\?<>'"\|\(\)@;]*\.[^:\*<>'"\|\(\)@;]+)( *['"]*\))/g,
  /(')([^:\*\?<>'"\|\(\)@;]*\.[^:\*<>'"\|\(\)@;]+)(')/g,
  /(")([^:\*\?<>'"\|\(\)@;]*\.[^:\*<>'"\|\(\)@;]+)(")/g,
]

/*
 {
 log: false,
 hashLength: 8,
 destRoot: 'app',
 hashFiles: ['/**//*.js', '/**//*.css'],
 hostFiles: ['/**//*.js', '/**//*.html', '/**//*.css'],
 delay: 0
 }
 * */
function StaticResHashPlugin(options){
  if(!options) options = {};
  if(!options.hashFiles){
    console.error('hashFiles is needed!');
  }
  if(!options.hostFiles){
    console.error('hostFiles is needed!');
  }
  if(options.destRoot === undefined){
    console.error('destRoot is needed!');
  }
  options.delay = options.delay ? +options.delay : 0;
  this.options = options;
  this.options.hashLength = options.hashLength || 8;
}

var globOpts;

StaticResHashPlugin.prototype.apply = function(compiler){
  this.compiler = compiler;
  compiler.plugin('done', function(){
    var that = this;
    setTimeout(function(){
      globOpts = {
        root: path.resolve(path.join(process.cwd(), that.options.destRoot)),
        nodir: true,
        log: !!that.options.log
      };

      globOpts.log && console.log('current context path : ' + process.cwd());

      var hashFiles = that.options.hashFiles;
      var hostFiles = that.options.hostFiles;
      var hashLength = that.options.hashLength;
      var tmpFiles, hashFilExist;
      for(var i = 0; i < hashFiles.length; i++){
        tmpFiles = glob.sync(hashFiles[i], globOpts);
        for(var j = 0; j < tmpFiles.length; j++){
          var obj = {
            path: path.resolve(tmpFiles[j]),
            hash: calcHashByFile(tmpFiles[j], hashLength)
          };
          obj.ext = path.extname(tmpFiles[j]);
          obj.name = path.basename(tmpFiles[j], obj.ext);
          obj.hashBaseName = obj.name + '.' + obj.hash + obj.ext;
          obj.hashPath = path.join(path.dirname(obj.path), obj.hashBaseName);

          hashFilExist = false;
          for(var m = 0; m < hashFileObjects.length; m++){
            if(hashFileObjects[m].path === obj.path){
              hashFilExist = true;
              break;
            }
          }
          !hashFilExist && hashFileObjects.push(obj);
        }
      }

      for(i = 0; i < hostFiles.length; i++){
        tmpFiles = glob.sync(hostFiles[i], globOpts);
        for(j = 0; j < tmpFiles.length; j++){
          updateHashRef(tmpFiles[j]);
        }
      }

      //rename hashFiles
      for(i = 0; i < hashFileObjects.length; i++){
        globOpts.log && console.log('file [' + hashFileObjects[i].path + '] execute rename --> [' + hashFileObjects[i].hashPath + ']');
        fs.renameSync(hashFileObjects[i].path, hashFileObjects[i].hashPath);
      }
    }, that.options.delay);
  }.bind(this));
}


function calcHashByFile(fp, length){
  var cont = fs.readFileSync(fp, 'utf8');
  var shaHasher = crypto.createHash('sha1');
  shaHasher.update(cont);
  return shaHasher.digest('hex').slice(0, length);
}

function updateHashRef(hostFilePath){
  var cont = fs.readFileSync(hostFilePath, 'utf8');
  for(var i = 0; i < filePatterns.length; i++){
    cont = cont.replace(filePatterns[i], function(cont, sm01, link, sm03){
      var ext = path.extname(hostFilePath).toUpperCase();
      var dir = path.dirname(hostFilePath);
      var linkAbsPath;
      var originalLink = link;
      var queryStartIndex = link.indexOf('?');
      var queryString = '';
      if(queryStartIndex > -1){
        link = link.substr(0, queryStartIndex);
        queryString = originalLink.substring(queryStartIndex, originalLink.length);
      }
      //path in css. path begin with dot or virgule is relative.
      if('.CSS' === ext && (link.startsWith('.') || (!link.startsWith('/') && !link.startsWith('\\')))){
        linkAbsPath = path.join(dir, link);
      }else{
        linkAbsPath = path.join(globOpts.root, link);
      }
      if(linkAbsPath && fs.existsSync(linkAbsPath)){
        //find hashvalue from hashFiles
        for(var j = 0; j < hashFileObjects.length; j++){
          if(hashFileObjects[j].path === linkAbsPath){
            globOpts.log && console.log('file [' + hostFilePath + '] execute replace [' + link + '] --> [' + hashFileObjects[j].hashBaseName + ']')
            return sm01 + path.join(path.dirname(link), hashFileObjects[j].hashBaseName).replace(/\\/g, '/') + queryString + sm03;
          }
        }
      }
      return cont;
    });
  }
  fs.writeFileSync(hostFilePath, cont);
}

module.exports = StaticResHashPlugin

