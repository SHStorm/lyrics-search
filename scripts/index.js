const $searchForm = document.getElementById('search-form');
const $content = document.getElementById('content');

$searchForm.addEventListener('submit', handleSearchSubmission);

async function handleSearchSubmission(event) {
    event.preventDefault();

    const searchData = new FormData($searchForm);
    const searchQuery = searchData.get('query').trim();

    if (searchQuery === '') {
        alert('Search query cannot be empty!');
        return;
    } else if (/[а-я]/i.test(searchQuery)) {
        alert('Search query cannot include cyrillic symbols!');
        return;
    }

    $searchForm.reset();

    renderSearchResults(await searchSongs(searchQuery));
}

function renderSearchResults(searchResults) {
    $content.innerHTML = '';

    if (searchResults === null) {
        $content.textContent = 'No results satisfying your query';
        return;
    }

    $content.appendChild(createSearchResultsDOM(searchResults));
}

function renderLyrics(songLyrics) {
    $content.innerHTML = '';

    if (songLyrics === null) {
        $content.textContent = 'Lyrics for this song were not found';
        return;
    }

    const { song, author, lyrics } = songLyrics;
    $content.appendChild(createLyricsDOM(song, author, lyrics));
}

async function searchSongs(query) {
    const searchResponse = await fetch(`https://api.lyrics.ovh/suggest/${query}`);
    const songs = await searchResponse.json();

    if (songs.total === 0) {
        return null;
    }

    return songs;
}

async function searchLyrics(song, author) {
    const lyricsResponse = await fetch(`https://api.lyrics.ovh/v1/${author}/${song}`);

    if (lyricsResponse.status === 404) {
        return null;
    }

    const lyricsData = await lyricsResponse.json();
    const lyrics = lyricsData.lyrics;

    return { song, author, lyrics };
}

function createSearchResultsDOM({ data: songs, prev, next }) {
    const $searchResults = document.createElement('article');
    $searchResults.classList.add('search-results');

    $searchResults.appendChild(createSongsListDOM(songs));
    $searchResults.appendChild(createNavigationDOM(prev, next));

    return $searchResults;
}

function createSongsListDOM(songs) {
    const $songs = document.createElement('ul');
    $songs.classList.add('songs');

    $songs.append(...songs.map(createSongDom));

    return $songs;
}

function createSongDom({ title, artist }) {
    const $song = document.createElement('li');
    $song.classList.add('song-item');

    const $songInfo = document.createElement('p');

    const $author = document.createElement('span');
    $author.classList.add('author');
    $author.textContent = artist.name;

    $songInfo.appendChild($author);

    $songInfo.appendChild(document.createTextNode(' - '));

    const $title = document.createElement('span');
    $title.classList.add('song-title');
    $title.textContent = title;

    $songInfo.appendChild($title);

    $song.appendChild($songInfo);

    const $lyricsButton = document.createElement('button');
    $lyricsButton.classList.add('button', 'small-button');
    $lyricsButton.textContent = 'Lyrics';
    $lyricsButton.addEventListener('click', async () => {
        renderLyrics(await searchLyrics(title, artist.name));
    });

    $song.appendChild($lyricsButton);

    return $song;
}

function createNavigationDOM(prev, next) {
    const $navigation = document.createElement('nav');
    $navigation.classList.add('nav');

    $navigation.appendChild(createNavigationButtonDOM(prev, 'Prev'));
    $navigation.appendChild(createNavigationButtonDOM(next, 'Next'));

    return $navigation;
}

function createNavigationButtonDOM(url, text) {
    const $button = document.createElement('button');
    $button.classList.add('button', 'nav-button');
    $button.textContent = text;
    $button.disabled = url === undefined;
    $button.addEventListener('click', async () => {
        const response = await fetchCors(url);
        const responseBody = await response.json();
        renderSearchResults(responseBody);
    });

    return $button;
}

function createLyricsDOM(title, author, lyrics) {
    const $lyrics = document.createElement('article');

    const $header = document.createElement('h2');
    $header.classList.add('lyrics-header');

    const $author = document.createElement('span');
    $author.classList.add('author');
    $author.textContent = author;

    $header.appendChild($author);

    $header.appendChild(document.createTextNode(' - '));

    const $title = document.createElement('span');
    $title.textContent = title;

    $header.appendChild($title);

    $lyrics.appendChild($header);

    const $lyricsContent = document.createElement('pre');
    $lyricsContent.textContent = lyrics;

    $lyrics.appendChild($lyricsContent);

    return $lyrics;
}

function fetchCors(url) {
    return fetch(`https://cors-anywhere.herokuapp.com/${url}`);
}
