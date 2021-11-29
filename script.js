(function () {
  function randomId() {
    min = Math.ceil(1000);
    max = Math.floor(1000000);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function sleepFor(sleepDuration) {
    var now = new Date().getTime();
    while (new Date().getTime() < now + sleepDuration) {
      /* Do nothing */
    }
  }

  function getTargets() {
    //Get available targets
    // CREATE AN XMLHttpRequest OBJECT, WITH GET METHOD.
    var xhr = new XMLHttpRequest(),
      method = "GET",
      overrideMimeType = "application/json",
      url = "http://localhost:8000/api/v1/targets"; // ADD THE URL OF THE TARGETS.

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        console.log(data);
        var select = document.getElementById("target");
        for (var i = 0; i < data.length; i++) {
          var option = document.createElement("option");
          option.text = data[i].name;
          option.value = data[i].id;
          select.add(option);
        }
      }
    };

    xhr.open(method, url, true);
    xhr.send();
  }
  var target = document.getElementById("target");
  var targetName;
  target.addEventListener("change", function () {
    // choose the selected option
    var selectedOption = target.options[target.selectedIndex];
    // get the value of the selected option
    var targetId = selectedOption.value;
    // get the text of the selected option
    targetName = selectedOption.text;
    //   show();
    console.log(targetName);
    document.getElementById("form").innerHTML =
      '<label for="target">Target</label><select class="form-control" id="target" name="target" onchange="show(this)"><option value="">' +
      targetName +
      "</option></select>";
  });

  var f = document.getElementById("file");
  if (f.files.length) processFile();
  var el = document.getElementById("submit");
  el.addEventListener("click", processFile, false);

  function processFile(e) {
    var file = f.files[0];
    var size = file.size;
    // var sliceSize = 1024 * 1024 * 10; 10 MB
    var sliceSize = 1024; // for dev reasons only
    var chunkCount = size < sliceSize ? 1 : Math.round(size / sliceSize) + 1;
    var start = 0;
    var uploadId = randomId();
    var userid = document.getElementById("name").value;
    console.log("userid:" + userid);
    var target = targetName;
    console.log("target: " + target);
    console.log("uploadid:" + uploadId);

    for (let currentChunk = 0; currentChunk < chunkCount; currentChunk++) {
      document.getElementById(
        "form"
      ).innerHTML = `Uploading... ${currentChunk}/${chunkCount}`;
      let end = start + sliceSize;

      if (size - end < 0) {
        end = size;
      }

      let s = slice(file, start, end);
      console.log(`Sending chunk: ${currentChunk}/${chunkCount}`);

      send(
        uploadId,
        s,
        start,
        end,
        size,
        chunkCount,
        currentChunk,
        target,
        userid
      );

      if (end < size) {
        start += sliceSize;
      }
      sleepFor(100);
    }

    console.log("DONE");
  }

  function send(
    uploadId,
    piece,
    start,
    end,
    size,
    chunkCount,
    currentChunk,
    target,
    userid
  ) {
    var formdata = new FormData();
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (currentChunk === chunkCount - 1) {
          document.getElementById("form").style.display = "none";
          document.getElementById(
            "info-response"
          ).innerHTML = `<pre>${this.response}</pre>`;
          document.getElementById("info").style.display = "block";
        }
      }
    };

    xhr.open("POST", "http://localhost:8000/api/v1/releaseChunked", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("uploader-file-id", uploadId);
    xhr.setRequestHeader("uploader-chunk-number", currentChunk);
    xhr.setRequestHeader("uploader-chunks-total", chunkCount);
    xhr.setRequestHeader("target", target);
    xhr.setRequestHeader("userid", userid);
    formdata.append("file", piece);

    xhr.send(formdata);
  }

  /**
   * Formalize file.slice
   */

  function slice(file, start, end) {
    var slice = file.mozSlice
      ? file.mozSlice
      : file.webkitSlice
      ? file.webkitSlice
      : file.slice
      ? file.slice
      : noop;

    return slice.bind(file)(start, end);
  }

  function noop() {}

  document.onload = getTargets();
})();
