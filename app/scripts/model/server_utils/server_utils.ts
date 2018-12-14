import { SERVER_REQUEST_PATH } from "../../constants.js";

export class ServerUtils {
  public static postTest(): void {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", SERVER_REQUEST_PATH, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
      value: "123",
    }));

    xhr.onreadystatechange = () => {
      // if data isn't fully received
      if (xhr.readyState !== 4) return;

      if (xhr.status === 200) {
        console.log(xhr.responseText);
      } else {
        throw new Error(`Request error no. ${xhr.status}`);
      }
    }
  }
}
