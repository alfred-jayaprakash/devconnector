const express = require('express')
const router = express.Router()
const auth = require('../../middeware/auth')
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const config = require('config')
const request = require('request')

const Post = require('../..//models/Post')
const Profile = require('../..//models/Profile')
const User = require('../../models/User')

//@route    GET api/profile/me
//@desc     Get current user's profile
//@access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])

        if (!profile) {
            return res.status(400).send({ msg: 'Cannot find profile for user' })
        }
        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    POST api/profile
//@desc     Create or update current user's profile
//@access   Private
router.post('/', [
    auth,
    [
        check('status', 'Status is required').notEmpty(),
        check('skills', 'Skills are required').notEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body

    //Buidl profile object
    const profileFields = {}
    profileFields.user = req.user.id
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername
    if (company) profileFields.company = company
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim())
    }

    //Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (twitter) profileFields.social.twitter = twitter
    if (linkedin) profileFields.social.linkedin = linkedin
    if (instagram) profileFields.social.instagram = instagram

    try {
        let profile = await Profile.findOne({ user: req.user.id })

        if (profile) {
            console.log("Profile exists. Will be updating.")
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            )
            return res.json(profile)
        }

        profile = new Profile(profileFields)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    GET api/profile/me
//@desc     Get current user's profile
//@access   Private
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    GET api/profile/user/:user_id
//@desc     Get a profile by UserID
//@access   Private
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])
        if (!profile) {
            return res.status(400).send({ msg: 'Cannot find profile for user' })
        }
        res.json(profile)
    } catch (err) {
        console.error(err)
        if (err.kind == 'ObjectId') {
            return res.status(400).send({ msg: 'Cannot find profile for user' })
        }
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    DELETE api/profile/me
//@desc     Delete profile, user & posts
//@access   Private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove user posts
        await Post.findOneAndRemove({ user: req.user.id })

        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id })

        //Remove user
        await User.findByIdAndRemove(req.user.id)

        res.json({ msg: "User deleted successfully" })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    PUT api/profile/xp
//@desc     Add profile experience
//@access   Private
router.put('/xp', [
    auth,
    [
        check('title', 'Title is required').notEmpty(),
        check('company', 'Company is required').notEmpty(),
        check('from', 'From Date is required').notEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        let profile = await Profile.findOne({ user: req.user.id })

        if (!profile) {
            console.log("Cannot find user profile")
            return res.status(400).send({ msg: 'Invalid profile' })
        }

        profile.experience.unshift(newExp)
        await profile.save()

        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    DELETE experience
//@desc     Delete experience
//@access   Private
router.delete('/xp/:xpid', auth, async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id })

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.xpid)

        profile.experience.splice(removeIndex, 1)

        await profile.save()

        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    PUT api/profile/edu
//@desc     Add profile education
//@access   Private
router.put('/edu', [
    auth,
    [
        check('school', 'School is required').notEmpty(),
        check('degree', 'Degree is required').notEmpty(),
        check('fieldofstudy', 'Field of study is required').notEmpty(),
        check('from', 'From Date is required').notEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        let profile = await Profile.findOne({ user: req.user.id })

        if (!profile) {
            console.log("Cannot find user profile")
            return res.status(400).send({ msg: 'Invalid profile' })
        }

        profile.education.unshift(newEdu)
        await profile.save()

        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    DELETE education
//@desc     Delete education
//@access   Private
router.delete('/edu/:eduid', auth, async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id })

        //Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.eduid)

        profile.education.splice(removeIndex, 1)

        await profile.save()

        res.json(profile)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    GET api/profile/github/:username
//@desc     Get Github profiles
//@access   Private
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        request(options, (error, response, body) => {
            if(error) console.error(error)

            if(response.statusCode !== 200) {
                console.error("Cannot find Github profile")
                return res.status(404).send({ msg: 'No Github profile found' })
            }

            res.json(JSON.parse(body))
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

module.exports = router