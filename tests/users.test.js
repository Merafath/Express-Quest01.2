const request = require("supertest");

const app = require("../src/app");

const database = require("../database");

afterAll(() => database.end());

describe("GET /api/users", () => {
  it("should return all users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });
});

describe("GET /api/users/:id", () => {
  it("should return one user", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });

  it("should return no user", async () => {
    const response = await request(app).get("/api/users/0");

    expect(response.status).toEqual(404);
  });
});

const crypto = require("node:crypto");

describe("POST /api/users", () => {
  it("should return created user", async () => {
    const newUser = {
      firstname: "Marie",
      lastname: "Martin",
      email: `${crypto.randomUUID()}@wild.co`,
      city: "Paris",
      language: "French",
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toHaveProperty("id");
    expect(typeof response.body.id).toBe("number");

    const [result] = await database.query(
      "SELECT * FROM users WHERE id=?",
      response.body.id
    );

    const [userInDatabase] = result;

    expect(userInDatabase).toHaveProperty("id");

    expect(userInDatabase).toHaveProperty("email");
    expect(userInDatabase.email).toStrictEqual(newUser.email);
  });

  it("should return an error", async () => {
    const userWithMissingProps = { firstname: "Usermissingprops" };

    const response = await request(app)
      .post("/api/users")
      .send(userWithMissingProps);

    expect(response.status).toEqual(500);
  });
});

describe("PUT /api/users/:id", () => {
  it("should edit user", async () => {
    const newUser = {
      firstname: "Arthur",
      lastname: "Nain",
      email: `${crypto.randomUUID()}@wild.co`,
      city: "Audenge",
      language: "Francais",
    };

    const [result] = await database.query(
      "INSERT INTO users(firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)",
      [
        newUser.firstname,
        newUser.lastname,
        newUser.email,
        newUser.city,
        newUser.language,
      ]
    );

    const id = result.insertId;

    const updatedUser = {
      firstname: "Emilie",
      lastname: "crtz",
      email: `${crypto.randomUUID()}@wild.co`,
      city: "Toulouse",
      language: "francais",
    };

    const response = await request(app)
      .put(`/api/users/${id}`)
      .send(updatedUser);

    expect(response.status).toEqual(204);

    const [users] = await database.query("SELECT * FROM users WHERE id=?", id);

    const [userInDatabase] = users;

    expect(userInDatabase).toHaveProperty("id");

    expect(userInDatabase).toHaveProperty("firstname");
    expect(userInDatabase.firstname).toStrictEqual(updatedUser.firstname);

    expect(userInDatabase).toHaveProperty("lastname");
    expect(userInDatabase.lastname).toStrictEqual(updatedUser.lastname);

    expect(userInDatabase).toHaveProperty("email");
    expect(userInDatabase.email).toStrictEqual(updatedUser.email);

    expect(userInDatabase).toHaveProperty("city");
    expect(userInDatabase.city).toStrictEqual(updatedUser.city);

    expect(userInDatabase).toHaveProperty("language");
    expect(userInDatabase.language).toStrictEqual(updatedUser.language);
  });

  it("should return an error", async () => {
    const userWithMissingProps = { firstname: "userwithmissingprops" };

    const response = await request(app)
      .put(`/api/users/1`)
      .send(userWithMissingProps);

    expect(response.status).toEqual(500);
  });

  it("should return no user", async () => {
    const newUser = {
      firstname: "xxx",
      lastname: "yyy",
      email: `${crypto.randomUUID()}@wild.co`,
      city: "Lyon",
      language: "Spanish",
    };

    const response = await request(app).put("api/users/0").send(newUser);

    expect(response.status).toEqual(404);
  });
});
