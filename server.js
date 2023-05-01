import http                      from 'http';
import fs                        from 'fs';
import path                      from 'path';
import { fileURLToPath }         from 'url';
import dotenv                    from 'dotenv';
import mysql                     from 'mysql2';
import qs                        from 'querystring';
import bcrypt                    from 'bcrypt';
import { privateKey, publicKey } from './JWTRSKEY.js'
import jwt                       from 'jsonwebtoken';
import JWTOption                 from './JWTSecretKey.js'

const __fileName = fileURLToPath(import.meta.url);
const __dirName  = path.dirname(__fileName);
const root       = path.join(__dirName);
dotenv.config({path : path.join(root, '.env')})
// console.log(process.env);

const DB = mysql.createConnection({
  host : process.env.mysqlHost,
  user : process.env.mysqlUser,
  port : process.env.mysqlPort,
  password : process.env.mysqlPassword,
  database : process.env.mysqlDatabase
})
DB.connect(()=>console.log('DB server running...'))

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
    rep.end();
  }

  switch (req.method) {
    case 'GET' :
      switch (req.url) {
        case '/' :
          return autoRep(200,'index.html', 'text/html');
        case '/testURL' :
          // console.log(req.headers.cookie);
          const token = req.headers.cookie.split('=')[1];
          console.log(token)
          const result = jwt.verify(token, publicKey, {algorithms : 'RS256'});
          console.log(result);
        default :
          try {
            rep.writeHead(200,{'Content-Type':`${getMIME()}; charset=utf-8`})
            rep.write(fs.readFileSync(path.join(root,req.url)));
            return rep.end();
          } catch {
            return autoRep(404,'notFound.html', 'text/html');
          }
      }
    case 'POST' :
      switch (req.url) {
        case '/checkLogin' :
          let Data = '';
          req.on('data', chunk=>Data+=chunk);
          req.on('end', ()=>{
            const _Data = qs.parse(Data);
            DB.query(`select ID,PW from user_info WHERE ID='${_Data.ID}'`, (err, result)=>{
              if (err) console.log(err);
              if (result.length > 0) {
                // console.log(_Data);
                if (bcrypt.compareSync(_Data.PW, result[0].PW)) {
                  const token = jwt.sign({login:true, uid:result.ID},privateKey,JWTOption.option);
                  rep.writeHead(200,{'Set-Cookie':[`jwt=${token}; httpOnly`], 'Content-Type':'text/html; charset=utf-8'});
                  rep.write(`<script>location.href='index.html'</script>`)
                  rep.end();
                }
              } else {
                rep.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
                rep.write(`<script>alert('아이디 혹은 비밀번호를 잘못 입력하셨습니다.'); location.href='login.html'</script>`);
                rep.end();
              }
            })
          })
      }
  }
})
  .listen(8081,()=>{
    console.log('App server running...')
  })