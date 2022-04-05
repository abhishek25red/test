const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const url = require('url')
const nodemailer = require('nodemailer')
const { getMaxListeners } = require('process')
const JWT_SECRET = 'adewwvg#&$^gsdfghj&^*&#^$*&@hsfjskdzjfb&**&^$%&*hgjsdhfkjdsfhzjkFuckasdaAAASSsfsdffbticjbitchasdasd&*('
var transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers: 'SSLv3'
    },
    auth: {
        user: 'prish070@outlook.com',
        pass: 'Yash1294'
    }
});
mongoose.connect('mongodb://localhost:27017/auth', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(bodyParser.json())
app.post('/api/changepassword', async (req, res) => {
    const { password, currentUrl } = req.body
    const { id, token } = url.parse(currentUrl, true).query
    console.log(id)
    console.log(token)
    console.log(password)
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.findOne({ id }).lean()
    if (!user) {
        return res.json({ status: 'error', error: 'Invalid User' })
    }
    else {
        const secret = JWT_SECRET + user.password
        try {
            const payload = jwt.verify(token, secret)
            await User.updateOne(
                { id },
                {
                    $set: { password: hashedPassword }
                })
        }
        catch (error) {
            return res.json({ status: 'error', error: error.message })
        }
    }
})
app.post('/api/send', async (req, res) => {
    const { mail } = req.body
    const user = await User.findOne({ mail }).lean()
    if (!user) {
        return res.json({ status: 'error', error: 'Invalid EMAIL-ID' })
    }
    else {
        const secret = JWT_SECRET + user.password
        const payload = {
            email: user.mail,
            id: user._id
        }
        const token = jwt.sign(payload, secret, { expiresIn: '15m' })
        const link = `http://localhost:8082/changepassword.html?id=${user._id}&token=${token}`
        const mailConfigurations = {
            from: 'prish070@outlook.com',
            to: user.mail,
            subject: 'Forget Password Link',
            html: `Hello There,<br>This is your password reset link ......<br> <a href="${link}">Click Here</a>`
        };
        transporter.sendMail(mailConfigurations, function (error, info) {
            if (error) throw Error(error);
            console.log('Email Sent Successfully');
            console.log(info);
        });
        return res.json({ status: 'ok', data: link })
    }
})
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username }).lean()
    if (!user) {
        return res.json({ status: 'error', error: 'Invalid UserName/PassWord' })
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            JWT_SECRET
        )
        return res.json({ status: 'ok', data: token })
    }
    res.json({ status: 'error', error: 'Invalid UserName/PassWord' })
})
app.post('/api/register', async (req, res) => {
    console.log(req.body)
    const { username, password: plainTextPassword, fname, lname, pnumber, mail } = req.body
    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', error: 'Invalid Username' })
    }
    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid Password' })
    }
    if (plainTextPassword.length < 8) {
        return res.json({ status: 'error', error: 'Password length should be minimum 8' })
    }
    if (!fname || typeof fname !== 'string') {
        return res.json({ status: 'error', error: 'Enter correct First Name' })
    }
    if (!lname || typeof lname !== 'string') {
        return res.json({ status: 'error', error: 'Enter correct Last Name' })
    }
    if (!pnumber || pnumber.length !== 10) {
        return res.json({ status: 'error', error: 'Enter correct Mobile Number' })
    }
    if (!mail) {
        return res.json({ status: 'error', error: 'Enter correct Email - Id' })
    }
    if (username.length < 5) {
        return res.json({ status: 'error', error: 'Username length should be minimum 5' })
    }
    const password = await bcrypt.hash(plainTextPassword, 10);
    console.log(await bcrypt.hash(plainTextPassword, 10))
    try {
        const response = await User.create({
            username,
            password,
            fname,
            lname,
            pnumber,
            mail
        })
        console.log('User created Successfully: ', response)
    }
    catch (error) {
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'Username Already Taken' })
        }
        throw error
    }
    res.json({ status: 'ok' })
})
app.listen(8082, () => {
    console.log('wasd')
})