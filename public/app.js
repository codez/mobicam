MAX_IMAGE_DIMENSION = 1800;

const el = function (id) {
  return document.getElementById(id);
};

const prepareUpload = async function (e) {
  if (!new XMLHttpRequest().upload) {
    el("message").innerHTML = "Dein Gerät wird leider nicht unterstützt.";
  } else if (e.target.files.length > 0) {
    file = e.target.files[0];
    const scaledFile = await scaleImage(file);
    uploadFile(scaledFile);
  }
};

const scaleImage = async function (file) {
  // Get as image data
  const imageBitmap = await createImageBitmap(file);
  const [width, height] = getScaledDimensions(imageBitmap);
  console.log(width, height);
  if (!width) return await new Promise((resolve) => resolve(file));

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Turn into Blob
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg")
  );

  // Turn Blob into File
  return new File([blob], file.name, {
    type: blob.type,
  });
};

const getScaledDimensions = function (image) {
  if (image.width > image.height) {
    if (image.width > MAX_IMAGE_DIMENSION) {
      const height = Math.round(
        (image.height * MAX_IMAGE_DIMENSION) / image.width
      );
      return [MAX_IMAGE_DIMENSION, height];
    }
  } else if (image.height > MAX_IMAGE_DIMENSION) {
    const width = Math.round(
      (image.width * MAX_IMAGE_DIMENSION) / image.height
    );
    return [width, MAX_IMAGE_DIMENSION];
  }
  return [undefined, undefined];
};

const uploadFile = function (file) {
  var xhr = new XMLHttpRequest();
  // listen to progress
  xhr.upload.addEventListener(
    "progress",
    function (e) {
      if (e.lengthComputable) {
        var percent = parseInt((e.loaded / e.total) * 100);
        drawProgress(percent);
      }
    },
    false
  );

  // file received/failed
  xhr.onreadystatechange = function (e) {
    console.log(xhr);
    if (xhr.readyState === 4) {
      setCompleted(xhr.status);
    }
  };

  // show progress
  var form = el("form");
  form.style.display = "none";
  el("progress").style.display = "block";
  el("message").innerHTML = "";

  // start upload
  xhr.open("POST", form.action, true);
  var formData = new FormData();
  formData.append("upload", file, file.name);
  xhr.send(formData);
};

const drawProgress = function (percent) {
  if (percent <= 50) {
    el("right-side").style.display = "none";
    el("pie").style.clip = "rect(0, 200px, 200px, 100px)";
  } else {
    el("right-side").style.display = "block";
    el("right-side").style.transform = "rotate(180deg)";
    el("pie").style.clip = "rect(auto, auto, auto, auto)";
  }
  el("left-side").style.transform = "rotate(" + percent * 3.6 + "deg)";
  el("progress-number").innerHTML = percent;
};

const setCompleted = function (status) {
  var progress = el("progress");
  var message = el("message");
  if (status === 200 || status === 201) {
    drawProgress(100);
    progress.className = "success";
    message.innerHTML = "Merci beaucoup! Dein Bild wurde hinzugefügt.";
  } else {
    progress.className = "failure";
    message.innerHTML =
      "Hoppla, das hat leider nicht geklappt. " +
      "Versuch es später nochmals oder sonst mit einem anderen Gerät.";
  }
  setTimeout(function () {
    el("form").style.display = "block";
    progress.style.display = "none";
    progress.className = null;
  }, 5000);
};

document.addEventListener("DOMContentLoaded", function (_event) {
  el("file").addEventListener("change", prepareUpload, false);

  // Uncomment to debug progress pie
  // var percent = 0;
  // el("progress").style.display = "block";
  // setInterval(() => drawProgress(percent++ % 100), 100);
});
