# National Football Team (The Black Stars)

A CRUD express application to keep records of players of Ghana's national football team, the **Black Stars**.

## Getting Started

This project was developed using `Express` and `TypeScript`.

<br>

After _cloning_ the repository, you need to create a file named `.env` in the application directory with the following content:

```json
PORT=<PORT_NUMBER: Number>
SECRET=<SECRET: String>
```

eg.

```json
PORT=300
SECRET="Secret text"
```

`PORT` indicates the port number the express server should run on.
`SECRET` is used by _Passport_ during to establish sessions during authentication.

You also need to create a _mongodb_ database called **ghana_black_stars** on your computer in order to be able to fully utilize this project.

### Available Scripts

In the project directory, you can run:

#### `npm run build`

Transpiles `*.ts` files into plain Javascript and places them in the `dist` directory.

### `npm run dev`

Starts up the Node.js server in development mode.

#### `npm start`

Starts up the Node.js server without actively watching for changes.

### Main Application Endpoints

#### `POST /login`

Sample Request Body

```json
{
  "username": "alice",
  "password": "letmein"
}
```

`username` and `password` are **required**

Response

```json
{
  "success": true,
  "message": "Successfully logged in!"
}
```

#### `POST /signup`

Sample Request Body

```json
{
  "username": "Boss",
  "password": "test123!"
}
```

`username` and `password` are **required**

Sample Response

```json
{
  "success": true,
  "message": "Successfully signed up",
  "user": {
    "id": 6,
    "username": "Boss"
  }
}
```

#### `GET /logout`

Response

```json
{
  "success": true,
  "message": "Successfully logged out!"
}
```

#### `GET /players`

- This endpoint allows you to get a list of all players.
- Authentication is needed to access this endpoint.

Sample Response

```json
{
  "succes": true,
  "num_of_players": 2,
  "players": [
    {
      "_id": "6363bd5bbcf3e97dc0973d70",
      "name": "Michael Quarcoo",
      "age": 24,
      "plays_abroad": true,
      "club": "Liverpool",
      "is_captain": false,
      "jersey_number": 5,
      "position_of_play": 5,
      "__v": 0
    },
    {
      "_id": "6363c98fa13e346eeede3ec7",
      "name": "Kwesi Prah",
      "age": 18,
      "plays_abroad": false,
      "club": "Asante Kotoko",
      "is_captain": false,
      "jersey_number": 14,
      "position_of_play": 7,
      "__v": 0
    }
  ]
}
```

#### `POST /players`

- This enpoint allows you to add new players.
- Authentication is needed to access this endpoint.

Sample Request Body

```json
{
  "name": "Michael Quarcoo",
  "age": 24,
  "plays_abroad": true,
  "club": "Liverpool",
  "is_captain": false,
  "jersey_number": 5,
  "position_of_play": 5
}
```

`name`, `age`, `jersey_number` and `position_of_play` are **required**.

Sample Response

```json
{
  "success": true,
  "message": "Player added successfully",
  "player": {
    "name": "Michael Quarcoo",
    "age": 24,
    "plays_abroad": true,
    "club": "Liverpool",
    "is_captain": false,
    "jersey_number": 5,
    "position_of_play": 5,
    "_id": "6363c98fa13e346eeede3ec7",
    "__v": 0
  }
}
```

#### `PATCH /players/:id`

- This endpoint allows you to make modifications to the player with a given `id`.
- Authentication is needed to access this endpoint.

Sample Request URL

`/players/6363c98fa13e346eeede3ec7`

Sample Request Body

```json
{
  "age": 19,
  "plays_abroad": false,
  "clut": "Hearts of Oak"
}
```

Sample Response

```json
{
  "success": true,
  "player": {
    "_id": "6363c98fa13e346eeede3ec7",
    "name": "Michael Quarcoo",
    "age": 19,
    "plays_abroad": false,
    "club": "Liverpool",
    "is_captain": false,
    "jersey_number": 5,
    "position_of_play": 5,
    "__v": 0
  }
}
```

#### `DELETE /players/:id`

- This endpoint allows you to _delete_ the player with a given `id`.
- Authentication is needed to access this endpoint.

Sample Request URL

`/players/6363bdce193706e7943b732f`

Sample Response

```json
{
  "success": true,
  "player": {
    "_id": "6363bdce193706e7943b732f",
    "name": "Michael Quarcoo",
    "age": 18,
    "plays_abroad": false,
    "club": "Hearts of Oak",
    "is_captain": false,
    "jersey_number": 5,
    "position_of_play": 5,
    "__v": 0
  }
}
```
