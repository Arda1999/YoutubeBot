const { google } = require("googleapis");
const fs = require("fs");
const fetch = require("node-fetch");
const csv = require("fast-csv");
const csvParser = require("csv-parser");

// API anahtarınızı buraya girin
const apiKey = "";

// Belirli etiketlerle ilişkilendirilmiş popüler "shorts" videolarını alma
async function getPopularShortsByTags(tags, maxResults = 2) {
  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  const tagQuery = tags.map((tag) => `#${tag}`).join(" "); // Etiketleri birleştir

  const response = await youtube.search.list({
    part: "snippet",
    q: `#shorts ${tagQuery}`, // Belirli etiketlerle ilişkilendirilmiş popüler "shorts" videoları
    type: "video",
    maxResults: maxResults,
  });

  return response.data.items;
}

// Videoyu MP4 olarak kaydetme
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
  console.log(videoUrl1); // videoUrl değişkeninin değerini kontrol edin

  try {
    // Video içeriğini al
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.buffer();

    // Dosyaya yaz
    const filePath = `./${title}.mp4`;
    await fs.promises.writeFile(filePath, videoBuffer);

    console.log(`Video kaydedildi: ${filePath}`);

    // CSV dosyasına video ismini ekle
    addToCSV(title);
  } catch (error) {
    console.error("Video indirilirken hata oluştu:", error);
  }
}

// CSV dosyasına video ismini ekleme
function addToCSV(videoTitle) {
  const csvFilePath = "video_list.csv";

  // CSV dosyasını kontrol et
  if (!fs.existsSync(csvFilePath)) {
    // Dosya yoksa başlık ekleyerek oluştur
    fs.writeFileSync(csvFilePath, "Video Title\n");
  }

  // CSV dosyasını oku
  const existingTitles = [];
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (row) => {
      existingTitles.push(row["Video Title"]);
    })
    .on("end", () => {
      // Yeni video ismi CSV dosyasında var mı kontrol et
      if (existingTitles.includes(videoTitle)) {
        console.log("Uyarı: Bu video zaten kaydedilmiş!");
      } else {
        // Yeni video ismini CSV dosyasına ekle
        fs.appendFileSync(csvFilePath, `"${videoTitle}"\n`);
        console.log("Video ismi CSV dosyasına eklendi.");
      }
    });
}

// Kodun çalıştırılması
async function main() {
  const tags = ["komikhayvan", "memes"]; // İlgili etiketler
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
