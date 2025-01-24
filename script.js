const API_URL = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation,weathercode&timezone=auto";

// Emojis per le condizioni meteo
const weatherEmojis = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌧️", 53: "🌧️", 55: "🌧️", 
    61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️", 73: "❄️", 75: "❄️", 95: "⛈️", 96: "⛈️"
};

const weatherDescriptions = {
    0: "Soleggiato", 1: "Prevalentemente soleggiato", 2: "Parzialmente nuvoloso", 3: "Nuvoloso", 
    45: "Nebbia leggera", 48: "Nebbia", 51: "Pioviggine leggera", 53: "Pioviggine moderata", 
    55: "Pioviggine intensa", 61: "Pioggia leggera", 63: "Pioggia moderata", 65: "Pioggia intensa", 
    71: "Neve leggera", 73: "Neve moderata", 75: "Neve intensa", 95: "Temporale", 96: "Temporale con grandine"
};

const dayColors = {
    "Soleggiato": "#FFD700", // Giallo per sole
    "Prevalentemente soleggiato": "#FFE135", // Giallo chiaro
    "Parzialmente nuvoloso": "#ADD8E6", // Azzurro chiaro
    "Nuvoloso": "#B0C4DE", // Grigio chiaro
    "Nebbia leggera": "#D3D3D3", // Grigio
    "Nebbia": "#A9A9A9", // Grigio scuro
    "Pioviggine leggera": "#87CEEB", // Azzurro
    "Pioviggine moderata": "#4682B4", // Azzurro scuro
    "Pioviggine intensa": "#1E90FF", // Blu
    "Pioggia leggera": "#6495ED", // Blu chiaro
    "Pioggia moderata": "#4169E1", // Blu intenso
    "Pioggia intensa": "#0000FF", // Blu pieno
    "Neve leggera": "#E0FFFF", // Azzurro ghiaccio
    "Neve moderata": "#AFEEEE", // Azzurro pallido
    "Neve intensa": "#00CED1", // Turchese
    "Temporale": "#800080", // Viola
    "Temporale con grandine": "#4B0082" // Indigo
};

const toggleLoading = (show) => {
    document.getElementById("loading").style.display = show ? "block" : "none";
};

const getWeatherEmoji = (weatherCode) => weatherEmojis[weatherCode] || "🌥️";
const getDayColor = (description) => dayColors[description] || "#FFFFFF"; // Bianco di default
const getWeekdayName = (date) => new Date(date).toLocaleDateString("it-IT", { weekday: "long" });

async function getWeather() {
    const city = document.getElementById("city").value;
    if (!city) return alert("Inserisci un nome di città valido!");

    toggleLoading(true);

    try {
        const geoData = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`).then(res => res.json());
        if (!geoData.results?.length) return alert("Città non trovata. Riprova con un altro nome.");

        const { latitude, longitude } = geoData.results[0];
        const data = await fetch(API_URL.replace("{lat}", latitude).replace("{lon}", longitude)).then(res => res.json());
        displayForecast(data.hourly);
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        alert("Si è verificato un errore. Riprova più tardi.");
    } finally {
        toggleLoading(false);
    }
}

function displayForecast(hourlyData) {
    const forecastDiv = document.getElementById("forecast");
    forecastDiv.innerHTML = "";

    const groupedData = hourlyData.time.reduce((acc, time, i) => {
        const date = new Date(time).toLocaleDateString("it-IT");
        const entry = {
            time: new Date(time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            temperature: hourlyData.temperature_2m[i],
            precipitation: hourlyData.precipitation[i],
            weatherDescription: weatherDescriptions[hourlyData.weathercode[i]] || "Condizioni sconosciute",
            weatherEmoji: getWeatherEmoji(hourlyData.weathercode[i])
        };
        acc[date] = acc[date] || [];
        acc[date].push(entry);
        return acc;
    }, {});

    Object.entries(groupedData).forEach(([date, data]) => {
        const summary = data[0]; // Usa la prima ora come anteprima
        const dayColor = getDayColor(summary.weatherDescription);
        const weekdayName = getWeekdayName(date);
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("mb-4");

        dayDiv.innerHTML = `
            <h3>${weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1)} - ${date}</h3>
            <div class="card text-center" style="background-color: ${dayColor};">
                <div class="card-body">
                    <h5 class="card-title">${summary.weatherEmoji} ${summary.weatherDescription}</h5>
                    <p class="card-text">Temperatura: ${summary.temperature}°C</p>
                    <p class="card-text">Precipitazioni: ${summary.precipitation} mm</p>
                    <button class="btn btn-primary" onclick="toggleDayDetails('${date}')">Mostra Dettagli</button>
                </div>
            </div>
            <div id="details-${date}" style="display: none;">
                ${data.map(row => `
                    <div class="card my-2">
                        <div class="card-body">
                            <h6>${row.time} - ${row.weatherEmoji} ${row.weatherDescription}</h6>
                            <p>Temp: ${row.temperature}°C, Prec: ${row.precipitation} mm</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        forecastDiv.appendChild(dayDiv);
    });
}

function toggleDayDetails(date) {
    const detailsDiv = document.getElementById(`details-${date}`);
    const isVisible = detailsDiv.style.display === "block";
    detailsDiv.style.display = isVisible ? "none" : "block";
}
