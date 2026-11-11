
const API = "https://en.wikipedia.org/w/api.php";

async function askWikipedia(parameters) {

  const url = API + "?" +
    new URLSearchParams({
      ...parameters,
      format: "json",
      formatversion: "2",
      origin: "*"
    });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not contact Wikipedia.");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.info);
  }

  return data;
}


async function findBooks() {

  const button = document.getElementById("searchButton");
  const message = document.getElementById("message");
  const display = document.getElementById("books");

  button.disabled = true;
  display.innerHTML = "";

  try {

    message.innerText = "Searching for works... 🔎";

    // Ask Wikipedia for pages in our category
    const data = await askWikipedia({
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:Works published under a pseudonym",
      cmsort: "timestamp",
      cmdir: "desc",
      cmnamespace: "0",
      cmlimit: "20"
    });

    const books = data.query.categorymembers;

    if (books.length === 0) {
      message.innerText = "No books were found.";
      return;
    }

    message.innerText = "Finding covers...";

    // Ask Wikipedia for pictures and descriptions
    const details = await askWikipedia({
      action: "query",
      titles: books.map(book => book.title).join("|"),
      prop: "pageimages|extracts",
      piprop: "thumbnail",
      pithumbsize: "300",
      exintro: "1",
      explaintext: "1",
      exchars: "250"
    });

    const pages = details.query.pages;

    // Look at each book
    for (const book of pages) {

      if (book.missing) continue;

      // Create a book card
      const card = document.createElement("div");
      card.className = "book";

      // Book title
      const title = document.createElement("h3");
      title.innerText = book.title;

      card.appendChild(title);

      // Book picture
      if (book.thumbnail) {

        const picture = document.createElement("img");

        picture.src = book.thumbnail.source;
        picture.alt = "Picture of " + book.title;

        card.appendChild(picture);

      } else {

        const noPicture = document.createElement("p");

        noPicture.innerText = "📖 No picture available";

        card.appendChild(noPicture);
      }

      // Book description
      const description = document.createElement("p");

      description.innerText =
        book.extract || "No description available.";

      card.appendChild(description);

      // Wikipedia link
      const link = document.createElement("a");

      link.href =
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(book.title.replace(/ /g, "_"));

      link.innerText = "Read more";

      link.target = "_blank";
      link.rel = "noopener noreferrer";

      card.appendChild(link);

      // Put the card on the screen
      display.appendChild(card);
    }

    message.innerText =
      "Finished! Found " + display.children.length + " articles.";

  } catch (error) {

    message.innerText = "Something went wrong: " + error.message;

    console.error(error);

  } finally {

    button.disabled = false;

  }
}


// Start when the button is clicked
document
  .getElementById("searchButton")
  .addEventListener("click", findBooks);
