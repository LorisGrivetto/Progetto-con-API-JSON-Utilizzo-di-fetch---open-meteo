const API_URL = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation,weathercode&timezone=auto";

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
    "Soleggiato": "#FFD700", "Prevalentemente soleggiato": "#FFE135", "Parzialmente nuvoloso": "#ADD8E6",
    "Nuvoloso": "#B0C4DE", "Nebbia leggera": "#D3D3D3", "Nebbia": "#A9A9A9", "Pioviggine leggera": "#87CEEB",
    "Pioviggine moderata": "#4682B4", "Pioviggine intensa": "#1E90FF", "Pioggia leggera": "#6495ED",
    "Pioggia moderata": "#4169E1", "Pioggia intensa": "#0000FF", "Neve leggera": "#E0FFFF",
    "Neve moderata": "#AFEEEE", "Neve intensa": "#00CED1", "Temporale": "#800080",
    "Temporale con grandine": "#4B0082"
};

const toggleLoading = (show) => {
    document.getElementById("loading").style.display = show ? "block" : "none";
};

const getWeatherEmoji = (weatherCode) => weatherEmojis[weatherCode] || "🌥️";

const getDayColor = (description) => dayColors[description] || "#FFFFFF";

const getWeekdayName = (dateString) => {
   
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    const date = new Date(formattedDate);
    if (isNaN(date)) {
        console.error(`Data non valida: ${dateString}`);
        return "Data non valida";
    }
    return date.toLocaleDateString("it-IT", { weekday: "long" });
};


const getDetailColor = (precipitation, description) => {
    if (precipitation === 0) return "#C8E6C9"; 
    return dayColors[description] || "#FFFFFF";
};

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
       
        const date = new Date(time).toLocaleDateString("it-IT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        const entry = {
            time: new Date(time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            temperature: hourlyData.temperature_2m[i],
            precipitation: hourlyData.precipitation[i],
            weatherDescription: weatherDescriptions[hourlyData.weathercode[i]] || "Condizioni sconosciute",
            weatherEmoji: getWeatherEmoji(hourlyData.weathercode[i]),
        };
        acc[date] = acc[date] || [];
        acc[date].push(entry);
        return acc;
    }, {});

    Object.entries(groupedData).forEach(([date, data]) => {
        const summary = data[0];
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
            <div id="details-${date}" class="details-container" style="display: none;">
                <div class="details-scroll">
                    ${data.map(row => `
                        <div class="card my-2" style="background-color: ${getDetailColor(row.precipitation, row.weatherDescription)};">
                            <div class="card-body">
                                <h6>${row.time} - ${row.weatherEmoji} ${row.weatherDescription}</h6>
                                <p>Temp: ${row.temperature}°C, Prec: ${row.precipitation} mm</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
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
