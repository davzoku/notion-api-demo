const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// test connection to get db
// async function getDatabase() {
//   const response = await notion.databases.retrieve({
//     database_id: process.env.NOTION_DATABASE_ID,
//   });
//   console.log(response);
// }

// getDatabase();

async function getTags() {
  const database = await notion.databases.retrieve({
    database_id: process.env.NOTION_DATABASE_ID,
  });

  return notionPropertiesById(database.properties)[
    process.env.NOTION_FIELD_TAGS
  ].multi_select.options.map((option) => {
    return { id: option.id, name: option.name };
  });
}

function notionPropertiesById(properties) {
  return Object.values(properties).reduce((obj, property) => {
    const { id, ...rest } = property;
    return { ...obj, [id]: rest };
  }, {});
}

function createPage({ title, description, isDone, tags }) {
  notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID,
    },
    properties: {
      [process.env.NOTION_FIELD_TITLE]: {
        title: [
          {
            type: "text",
            text: {
              content: title,
            },
          },
        ],
      },
      [process.env.NOTION_FIELD_DESCRIPTION]: {
        rich_text: [
          {
            type: "text",
            text: {
              content: description,
            },
          },
        ],
      },
      [process.env.NOTION_FIELD_DONE]: {
        checkbox: isDone,
      },
      [process.env.NOTION_FIELD_COUNT]: {
        number: 0,
      },
      [process.env.NOTION_FIELD_TAGS]: {
        multi_select: tags.map((tag) => {
          return { id: tag.id };
        }),
      },
    },
  });
}

async function getPages() {
  const notionPages = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    sorts: [
      { property: process.env.NOTION_FIELD_COUNT, direction: "descending" },
    ],
  });

  return notionPages.results.map(fromNotionObject);
}

function fromNotionObject(notionPage) {
  const propertiesById = notionPropertiesById(notionPage.properties);

  return {
    id: notionPage.id,
    title: propertiesById[process.env.NOTION_FIELD_TITLE].title[0].plain_text,
    count: propertiesById[process.env.NOTION_FIELD_COUNT].number,
    tags: propertiesById[process.env.NOTION_FIELD_TAGS].multi_select.map(
      (option) => {
        return { id: option.id, name: option.name };
      }
    ),
    isProject: propertiesById[process.env.NOTION_FIELD_DONE].checkbox,
    description:
      propertiesById[process.env.NOTION_FIELD_DESCRIPTION].rich_text[0].text
        .content,
  };
}

//test input
// getTags().then((tags) => {
//   createPage({
//     title: "test",
//     description: "desc",
//     isDone: true,
//     count: 4,
//     tags: tags,
//   });
// });

async function increaseCount(pageId) {
  const page = await getPage(pageId);
  const count = page.count + 1;
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [process.env.NOTION_FIELD_COUNT]: { number: count },
    },
  });

  return count;
}

async function getPage(pageId) {
  return fromNotionObject(await notion.pages.retrieve({ page_id: pageId }));
}

module.exports = {
  createPage,
  getTags,
  getPages,
  increaseCount,
};
