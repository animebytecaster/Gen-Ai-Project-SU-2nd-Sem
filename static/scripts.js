async function classifyImagesWithRetry(formData, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("/classify", {
        method: "POST",
        body: formData,
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const results = await response.json();
      if (!Array.isArray(results)) throw new Error("Invalid response format");
      return results;
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("imageInput");
  const spinner = document.getElementById("spinner");
  const resultDiv = document.getElementById("result");
  const resultContent = document.getElementById("resultContent");

  if (!fileInput.files.length) {
    alert("Please select at least one image.");
    return;
  }

  spinner.classList.remove("hidden");
  resultDiv.classList.add("hidden");
  resultContent.innerHTML = "";

  const formData = new FormData();
  const files = Array.from(fileInput.files);

  files.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const results = await classifyImagesWithRetry(formData);

    results.forEach((result, index) => {
      const file = files[index];
      const reader = new FileReader();

      reader.onload = () => {
        const imageContainer = document.createElement("div");
        imageContainer.className =
          "col-md-6 d-flex flex-column align-items-center mb-4";
        imageContainer.style.minHeight = "500px"; // Further increased box height for vertical images

        const uploadedImage = document.createElement("img");
        uploadedImage.src = reader.result;
        uploadedImage.alt = `Uploaded Image ${index + 1}`;
        uploadedImage.className = "w-100 h-auto rounded shadow mb-3";
        uploadedImage.style.maxHeight = "400px"; // Further increased image height for better visibility

        const predictionDetails = document.createElement("div");
        predictionDetails.className = "text-center";

        if (result.error) {
          predictionDetails.innerHTML = `<p class="text-danger">Error: ${result.error}</p>`;
        } else {
          predictionDetails.innerHTML = `
                        <p><strong>Class:</strong> ${result.class}</p>
                        <p><strong>Confidence:</strong> ${(
                          result.confidence * 100
                        ).toFixed(2)}%</p>
                    `;
        }

        imageContainer.appendChild(uploadedImage);
        imageContainer.appendChild(predictionDetails);
        resultContent.appendChild(imageContainer);
      };

      reader.readAsDataURL(file);
    });

    resultContent.className = "row"; // Apply Bootstrap grid layout
    resultDiv.classList.remove("hidden");
  } catch (error) {
    resultContent.innerHTML = `<p class="text-red-600">Error: ${
      error.message || "Unable to classify the images. Please try again later."
    }</p>`;
    resultDiv.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
});

// Placeholder JavaScript file
console.log("Scripts loaded successfully.");
