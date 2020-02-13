const express = require('express')
const router = express.Router()
const auth = require('../../middeware/auth')
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const config = require('config')

const Post = require('../..//models/Post')
const User = require('../../models/User')

//@route    GET api/posts
//@desc     Posts route
//@access   Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1})
        res.json(posts)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }   
})

//@route    GET api/posts/:postid
//@desc     Get a post route
//@access   Private
router.get('/:postid', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postid)

        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }
        res.json(post)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }   
})

//@route    POST api/posts
//@desc     Creates posts
//@access   Private
router.post('/', [auth, [
    check('text', 'Text is required').notEmpty(),
]], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findByIdAndUpdate(req.user.id)

        const newPost = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        const post = new Post(newPost)
        await post.save()

        res.json(post)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    DELETE postid
//@desc     Delete a post
//@access   Private
router.delete('/:postid', auth, async (req, res) => {
    try {
        let post = await Post.findById(req.params.postid)
        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }

        //Check if post user
        if(post.user.toString() !== req.user.id) {
            return res.status(401).send({ msg: 'User not authorized to delete the post' })
        }
        await post.remove()
        res.send({msg: "Post removed successfully"})
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

//@route    PUT api/posts/like/:postid
//@desc     Like a post
//@access   Private
router.get('/like/:postid', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postid)

        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }

        //User not liking their own post
        if(post.user.toString() !== req.user.id) {
            if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).send({msg: 'Post already liked by user'})
            }

            post.likes.unshift({user: req.user.id})

            await post.save()
        } else {
            console.log('User liking their own post')
        }
        res.json(post)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }   
})

//@route    PUT api/posts/unlike/:postid
//@desc     Unlike a post
//@access   Private
router.get('/unlike/:postid', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postid)

        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }

        //User not liking their own post
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).send({msg: 'Post has not been liked'})
        }

        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)
        post.likes.splice(removeIndex, 1)

        await post.save()
        res.json(post)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }   
})

//@route    POST api/posts/comment
//@desc     Creates a comment
//@access   Private
router.post('/comment/:postid', [auth, [
    check('text', 'Text is required').notEmpty(),
]], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const post = await Post.findById(req.params.postid)
        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }

        const newComment = {
            text:req.body.text,
            user: req.user.id,
            avatar: req.user.avatar
        }
        post.comments.unshift(newComment)

        await post.save()
        res.json(post)
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    } 
})

//@route    DELETE /routes/api/posts/:postid/:commentid
//@desc     Delete a comment
//@access   Private
router.delete('/:postid/:commentid', auth, async (req, res) => {
    try {
        let post = await Post.findById(req.params.postid)
        if(!post) {
            return res.status(404).send({ msg: 'Post not found' })
        }

        //Pull out the comment
        const comment = post.comments.find(comment => comment.id.toString() === req.params.commentid)
        if(!comment) {
            return res.status(404).send({ msg: 'Comment not found' })
        }

        //Check user is deleting their own comment
        if(comment.user.id.toString() !== req.user.id) {
            return res.status(401).send({ msg: 'User not authorized to delete comment' })
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.id.toString()).indexOf(req.params.commentid)
        post.comments.splice(removeIndex, 1)

        await post.save()
        res.send({msg: "Comment removed successfully"})
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Internal server error' })
    }
})

module.exports = router