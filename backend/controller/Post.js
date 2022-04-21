import Post from "../models/Post.js";
import statusCode from "../constants/HttpStatusCode.js";
import User from "../models/User.js";

export const createdPost = async (req, res) => {
  try {
    const newPostData = {
      caption: req.body.caption,
      image: {
        public_id: "req.body.public_id",
        url: "req.body.url",
      },
      owner: req.user._id,
    };
    const post = await Post.create(newPostData);

    const user = await User.findById(req.user);

    user.posts.push(post._id);

    await user.save();

    res.status(statusCode.OK).json({
      success: true,
      post,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Post not Found",
      });
    }

    if (post.likes.includes(req.user._id)) {
      const index = post.likes.indexOf(req.user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(statusCode.OK).json({
        success: true,
        message: "Post Unliked!",
      });
    } else {
      post.likes.push(req.user._id);
      await post.save();
      return res.status(statusCode.OK).json({
        success: true,
        message: "Post liked!",
      });
    }
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Post is not exist",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Unauthorized",
      });
    }
    await post.remove();

    const user = await User.findById(req.user._id);
    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();
    res.status(statusCode.OK).json({
      success: true,
      message: "Post deleted!",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const getPostFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      owner: {
        $in: user.following,
      },
    });
    res.status(statusCode.OK).json({
      success: true,
      posts,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Post Not Found",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Unauthorized",
      });
    }
    post.caption = req.body.caption;
    await post.save();
    res.status(statusCode.OK).json({
      success: true,
      message: "Caption Updated..",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }
    const posts = user.posts;
    const followers = user.followers;
    const userId = user._id;
    const following = user.following;
    await user.remove();

    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findById(posts[i]);
      await post.remove();
    }

    // Remove User from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }

    // Remove User from following followers
    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);
      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }
    res.status(statusCode.OK).json({
      success: true,
      message: "Profile Deleted",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Post not found",
      });
    }

    let commentIndex = -1;
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        commentIndex = index;
      }
    });

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = req.body.comment;
      await post.save();
      return res.status(statusCode.OK).json({
        success: true,
        message: "comments updated",
      });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: req.body.comment,
      });
      await post.save();
      return res.status(statusCode.OK).json({
        success: true,
        message: "Comment Added",
      });
    }
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "post not found",
      });
    }

    if (post.owner.toString() === req.user._id.toString()) {
      if (req.body.commentId === undefined) {
        return res.status(statusCode.BAD_REQUEST).json({
          success: false,
          message: "Comment id is required",
        });
      }

      post.comments.forEach((item, index) => {
        if (item._id.toString() === req.body.commentId.toString()) {
          return post.comments.splice(index, 1);
        }
      });

      await post.save();

      return res.status(statusCode.OK).json({
        success: true,
        message: "Selected Comment has Deleted",
      });
    } else {
      post.comments.forEach((item, index) => {
        if (item.user.toString() === req.user._id.toString()) {
          return post.comments.splice(index, 1);
        }
      });
    }

    await post.save();
    res.status(statusCode.OK).json({
      success: true,
      message: "Your Comment has deleted",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};
