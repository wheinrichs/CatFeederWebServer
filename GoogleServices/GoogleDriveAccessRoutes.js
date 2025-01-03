import "dotenv/config";
import axios from "axios";

export default function GoogleDriveRoutes(app) {
  /*
Endpoint: /api/getFolderID
  This endpoint recieves a folder name and an accessToken (assigned when the user logs in via google) and
  searches the google drive for the user to find a folder that matches in name to the one provided. It 
  returns the folder ID to assist in searching or accessing a particular folder.
Output: 
  The folder ID of the folder with the passed in name in the google drive of the user.
*/
  app.post("/api/getFolderID", async (req, res) => {
    // Retrieve the folder name and the access token from the request
    const { folderName, accessToken } = req.body;
    try {
      // Search specifically for a folder in the google drive with the given folder name.
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // Retrieve the folder name from the response
      const folders = response.data.files;

      // If there are no items in the response, then there isn't a folder with that folder name
      if (folders.length === 0) {
        return res
          .status(404)
          .json({ message: `Folder with name ${folderName} not found` });
      }

      // Otherwise, there is a folder with that name and return the folder ID of the first folder found with that name
      res.json({ folderId: folders[0].id });
    } catch (error) {
      console.error("Error fetching folder ID:", error);
      res.status(500).json({ message: "Error fetching folder ID" });
    }
  });

  /*
  Endpoint: /api/video/:id
    This endpoint facilitates streaming videos from the users google drive to the front end application. This is
    necessary for permissions on web browsers like safari that require a complete range header to handle video streaming.
  Output: 
    The video is streamed using this endpoint. 
  */
  app.get("/api/video/:id", async (req, res) => {
    // Retrieve the video ID, the access token, and the range of the video
    const { id } = req.params;
    const accessToken = req.query.accessToken;
    const range = req.headers.range;

    if (!accessToken) {
      return res.status(400).send("Missing access token");
    }

    if (!range) {
      return res.status(416).send("Requires Range header");
    }

    try {
      // Fetch video metadata
      const metadataResponse = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${id}?fields=size,mimeType`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Retrieve the video size of the fetches video
      const videoSize = parseInt(metadataResponse.data.size, 10);
      const mimeType = metadataResponse.data.mimeType;

      // Parse the Range header using 512kb chunks
      const CHUNK_SIZE = 512 * 1024;
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

      // While there is content in the video stream the content
      if (start >= videoSize) {
        res.status(416).set({
          "Content-Range": `bytes */${videoSize}`,
        });
        return;
      }

      const contentLength = end - start + 1;

      // Set headers for partial content
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": mimeType,
      };

      res.writeHead(206, headers);

      // Stream the requested chunk
      const videoStreamResponse = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Range: `bytes=${start}-${end}`,
          },
          responseType: "stream",
        }
      );

      // Pipe the response from the server to the client
      videoStreamResponse.data.pipe(res);
    } catch (error) {
      console.error("Error fetching video:", error.response?.data || error);
      res.status(500).send("Error fetching video");
    }
  });
}
