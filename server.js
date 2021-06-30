require("dotenv").config();
const express = require("express");
const { getTags, createPage, getPages, increaseCount } = require("./notion");

const app = express();
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let tags = [];
getTags().then((data) => {
  tags = data;
});
setInterval(async () => {
  tags = await getTags();
}, 1000 * 60 * 60);

app.get("/", async (req, res) => {
  const pages = await getPages();
  res.render("index", { tags, pages });
});

app.post("/create-page", async (req, res) => {
  const { title, description, isDone, tagIds = [] } = req.body;

  await createPage({
    title,
    description,
    isDone: isDone != null,
    tags: (Array.isArray(tagIds) ? tagIds : [tagIds]).map((tagId) => {
      return { id: tagId };
    }),
  });

  res.redirect("/");
});

app.post("/increase-count", async (req, res) => {
  const count = await increaseCount(req.body.pageId);
  res.json({ count });
});

app.listen(process.env.PORT);
