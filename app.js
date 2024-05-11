const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')
let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started at localhost: 3000')
    })
  } catch (e) {
    console.log('error ocuured :${e.message}')
    process.exit(1)
  }
}
initializeDbAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const getUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const user = await db.get(getUserQuery)
  if (user !== undefined) {
    //400 User already exists
    response.status(400)
    response.send('User already exists')
  } else {
    //register new user post
    const checkPassword = request.body.password
    if (checkPassword.length < 5) {
      //400 Password is too short
      response.status(400)
      response.send('Password is too short')
    } else {
      //200 User created successfully
      const newUserRegistration = `INSERT INTO user(username,name,password,gender,location)
            VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`
      const newUser = await db.run(newUserRegistration)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserQ = `SELECT * FROM user WHERE username='${username}';`
  const user = await db.get(getUserQ)
  if (user === undefined) {
    //400 Invalid user
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPassCrct = await bcrypt.compare(password, user.password)
    if (isPassCrct === false) {
      //400 Invalid password
      response.status(400)
      response.send('Invalid password')
    } else {
      //200 Login success!
      response.status(200)
      response.send('Login success!')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQ = `SELECT * FROM user WHERE username='${username}';`
  const user = await db.get(getUserQ)
  if (user === undefined) {
    response.send("user doesn't exists")
  } else {
    const isPassCrct = await bcrypt.compare(oldPassword, user.password)
    //console.log(isPassCrct)
    if (isPassCrct === false) {
      response.status(400)
      response.send('Invalid current password')
    } else {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPas = await bcrypt.hash(newPassword, 10)
        const changePasswordQ = `UPDATE user
        SET password='${hashedPas}'
        WHERE username='${username}';`
        const updateUser = await db.run(changePasswordQ)
        response.status(200)
        response.send('Password updated')
      }
    }
  }
})

module.exports = app
