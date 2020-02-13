const express = require('express')
const router = express.Router()
const auth = require('../../middeware/auth')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

//@route    GET api/auth
//@desc     Auth route
//@access   Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    } catch(err) {
        console.log(err)
        res.status(500).send({"error": err})
    }
})

//@route    POST api/users
//@desc     Register user
//@access   Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', "Please enter the password").exists()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() })

    const {email, password} = req.body

    try {
        // See if user exists
        let user = await User.findOne({email})

        if(!user) {
            console.log("User not found")
            return res.status(400).json({errors: [{msg: "Invalid credentials"}]})
        }
        
        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            console.log("Passwords do not match")
            return res.status(400).json({errors: [{msg: "Invalid credentials"}]})
        }
        
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000}, (err, token) => {
            if(err) {
                throw err
            }
            res.json({token})
        })
    } catch (err) {
        console.log(err)
        return res.status(400).json({ errors: {Error: err}})
    }
    //res.send(JSON.stringify(req.body))
})

module.exports = router