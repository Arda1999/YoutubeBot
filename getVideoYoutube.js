const { google } = require("googleapis");
const fs = require("fs");
const fetch = require("node-fetch");
const csv = require("fast-csv");
const csvParser = require("csv-parser");

const apiKey = "";

async function getPopularShortsByTags(tags, maxResults = 2) {
  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  const tagQuery = tags.map((tag) => `#${tag}`).join(" ");
  const response = await youtube.search.list({
    part: "snippet",
    q: `#shorts ${tagQuery}`,
    type: "video",
    maxResults: maxResults,
  });

  return response.data.items;
}

async function saveVideoToDisk(videoId, title, videoUrl) {
  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  const response = await youtube.videos.list({
    part: "contentDetails",
    id: videoId,
  });

  const videoUrl1 = videoUrl;
  console.log(videoUrl1);
  try {
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.buffer();

    const filePath = `./${title}.mp4`;
    await fs.promises.writeFile(filePath, videoBuffer);

    console.log(`Video kaydedildi: ${filePath}`);

    addToCSV(title);
  } catch (error) {
    console.error("Video indirilirken hata oluştu:", error);
  }
}

function addToCSV(videoTitle) {
  const csvFilePath = "video_list.csv";

  if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, "Video Title\n");
  }

  const existingTitles = [];
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (row) => {
      existingTitles.push(row["Video Title"]);
    })
    .on("end", () => {
      if (existingTitles.includes(videoTitle)) {
        console.log("Uyarı: Bu video zaten kaydedilmiş!");
      } else {
        fs.appendFileSync(csvFilePath, `"${videoTitle}"\n`);
        console.log("Video ismi CSV dosyasına eklendi.");
      }
    });
}

async function main() {
  const tags = ["komikhayvan", "memes"];
  const shortsVideos = await getPopularShortsByTags(tags);

  for (const video of shortsVideos) {
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    console.log(`Başlık: ${video.snippet.title}`);
    console.log(`Video URL: ${videoUrl}`);
    console.log("---");
    await saveVideoToDisk(videoId, title, videoUrl);
  }
}

main();
