# Production Backend

This is a production backend application built with Node.js, Express, and MongoDB. It includes various features such as user management, tweet handling, video management, subscriptions, playlists, likes, comments, and more.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

## Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd backend_dev
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
PORT=3000
MONGO_URI=<your-mongodb-uri>
CORS_ORIGIN=<your-frontend-url>
```

## Running the Application

Start the server:
```sh
npm start
```

The server will start on the port specified in the `.env` file (default is 3000).

## API Endpoints

### User Routes
- `POST /api/v1/user/register` - Register a new user
- `POST /api/v1/user/login` - Login a user

### Healthcheck Routes
- `GET /api/v1/healthcheck` - Check the health of the server

### Tweet Routes
- `POST /api/v1/tweet` - Create a new tweet
- `GET /api/v1/tweet/:userId` - Get tweets of a user
- `PUT /api/v1/tweet/:tweetId` - Update a tweet
- `DELETE /api/v1/tweet/:tweetId` - Delete a tweet

### Like Routes
- `POST /api/v1/likes/video/:videoId` - Toggle like on a video
- `POST /api/v1/likes/comment/:commentId` - Toggle like on a comment
- `POST /api/v1/likes/tweet/:tweetId` - Toggle like on a tweet
- `GET /api/v1/likes/videos` - Get liked videos

### Video Routes
- `POST /api/v1/video` - Upload a new video
- `GET /api/v1/video/:videoId` - Get video details
- `PUT /api/v1/video/:videoId` - Update video details
- `DELETE /api/v1/video/:videoId` - Delete a video

### Comment Routes
- `GET /api/v1/comment/:videoId` - Get comments on a video
- `POST /api/v1/comment/:videoId` - Add a comment to a video
- `PUT /api/v1/comment/:commentId` - Update a comment
- `DELETE /api/v1/comment/:commentId` - Delete a comment

### Subscription Routes
- `POST /api/v1/subscription/:channelId` - Toggle subscription to a channel
- `GET /api/v1/subscription/:channelId` - Get subscribers of a channel
- `GET /api/v1/subscription/subscribed/:subscriberId` - Get channels subscribed by a user

### Playlist Routes
- `POST /api/v1/playlist` - Create a new playlist
- `GET /api/v1/playlist/:userId` - Get playlists of a user
- `GET /api/v1/playlist/details/:playlistId` - Get playlist details
- `PUT /api/v1/playlist/:playlistId` - Update a playlist
- `DELETE /api/v1/playlist/:playlistId` - Delete a playlist
- `POST /api/v1/playlist/:playlistId/video/:videoId` - Add a video to a playlist
- `DELETE /api/v1/playlist/:playlistId/video/:videoId` - Remove a video from a playlist

### Dashboard Routes
- `GET /api/v1/dashboard/stats/:channelId` - Get channel statistics
- `GET /api/v1/dashboard/videos/:channelId` - Get videos of a channel

## Project Structure

```
backend_dev/
├── src/
│   ├── controllers/
│   │   ├── tweet.controller.js
│   │   ├── subscription.controller.js
│   │   ├── playlist.controller.js
│   │   ├── like.controller.js
│   │   ├── healthcheck.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── comment.controller.js
│   ├── models/
│   │   ├── user.models.js
│   │   ├── tweets.models.js
│   │   ├── subscription.models.js
│   │   ├── palylists.models.js
│   │   ├── likes.models.js
│   │   ├── video.models.js
│   │   ├── comments.models.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── tweet.routes.js
│   │   ├── like.routes.js
│   │   ├── video.routes.js
│   │   ├── comment.routes.js
│   │   ├── subscription.routes.js
│   │   ├── playlist.routes.js
│   │   ├── dashboard.routes.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── ApiResponse.js
│   │   ├── ApiError.js
│   ├── db/
│   │   ├── index.js
│   ├── app.js
│   ├── index.js
│   ├── constants.js
├── .env
├── package.json
└── README.md
```