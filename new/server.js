import http                      from 'http';
import crypro                    from 'crypto';
import jwt                       from 'jsonwebtoken';
import mysql                     from 'mysql2';
import path                      from 'path'
import { fileURLToPath }         from 'url';
import fs                        from 'fs';
import { privateKey, publicKey } from './JWTKEYS.js'
import qs                        from 'querystring';

const __fileName = fileURLToPath(import.meta.url);
const __dirName  = path.dirname(__fileName);
const root       = path.join(__dirName, '../');

// console.log(root);


const server = http.createServer((req,rep)=>{
  function getMIME() {
    switch (true) {
      case req.url.endsWith('.html') :
        return 'text/html';
      case req.url.endsWith('.js')   :
        return 'text/javascript';
      case req.url.endsWith('.css')  :
        return 'text/css';
      default :
        return 'text/plain';
    }
  }
  
  function autoRep(statusCode, write=req.url, MIME=getMIME()) {
    rep.writeHead(statusCode, {'Content-Type':`${MIME}; charset=utf-8`});
    try {
      rep.write(fs.readFileSync(path.join(root, write)));
    } catch {
      rep.write(write);
    }
    return rep.end();
  }

  if (req.method === 'GET') {
    if (req.url==='/') {
      return autoRep(200, 'index.html', 'text/html');
    }
    if(req.url==='/test.html') {
      rep.writeHead(200,{'Content-Type':'text.html; charset=utf-8'});
      rep.write(fs.readFileSync(path.join(root, 'test.html')));
      return rep.end();
    }
    if (req.url==='/testCreateToken') {
      const token = jwt.sign({login:true}, privateKey, {algorithm:'RS256', issuer:'Kwak', expiresIn:'5m'});
      rep.writeHead(200, {'Set-Cookie':'mytoken='+token+'; httpOnly', 'Content-Type':'application/json'});
      return rep.end();
    }
    if (req.url==='/testCheckToken') {
      const token = req.headers.cookie.split('=')[1]
      console.log(token);
      try {
        const decoded = jwt.verify(token, publicKey, {algorithms:'RS256'});
        console.log(decoded);
        if (decoded) {
          rep.writeHead(200, {'Content-Type':'text/json; charset=utf-8'});
          rep.write(JSON.stringify(decoded));
          return rep.end();
        }
      } catch (e) {
        console.log(e)
        rep.writeHead(204, {'Content-Type':'text/plain; charset=utf-8'});
        rep.write(e.message);
        return rep.end();
      }
    }
    if (req.url==='/new/loginChecker.js') {
      rep.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8'});
      rep.write(fs.readFileSync(path.join(root,req.url)));
      return rep.end();
    }
    if (req.url==='/test.js') {
      rep.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8'});
      rep.write(fs.readFileSync(path.join(root,req.url)));
      return rep.end();
    }
    if (req.url==='/login.html') {
      rep.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      rep.write(fs.readFileSync(path.join(root,req.url)));
      return rep.end();
    }
  } else if (req.method==='post') {
    console.log(req.headers);
    if (req.url==='/login') {
      let body
      req.on('data', chunk => body+=chunk);
      req.on('end', ()=>{
        let _body = qs.parse(body);
        console.log(_body);
      })
    }
  }
})
  .listen(8080, ()=>console.log('run'))