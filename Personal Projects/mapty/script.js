
// requiring dependencies
const leaflet = require('leaflet');
// Creating Workout Class
class Workout {
    date = new Date();
    id = (new Date() + '').slice(-10)
    
    constructor(coords, distance, duration) {
        this .coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    
    setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
          months[this.date.getMonth()]
        } ${this.date.getDate()}`;
    }
}

// Creating Running Class
class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance
        return this.pace
    }
}
// Created Cycling Class
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this.setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
///////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Creating App Class
class App {
    #map;
    #mapZoom = 13;
    #mapEvent;
    #workouts = [];

    constructor() {
        // Reset Application
        this.reset();

        // Get user's position
        this.getPosition();

        // Get data from local storage
        this.getLocalStorage()

        // Attaching event listeners
        form.addEventListener('submit', this.newWorkout.bind(this));
        inputType.addEventListener('change', this.toggleElevationField);
        containerWorkouts.addEventListener('click', this.moveToWorkout.bind(this))
    }

    getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.loadMap().bind(this), function() {
                alert('Could not get your position')
            })
        }
    }

    loadMap(position) {
        const {latitude} = position.coords
        const {longitude} = position.coords
        const coords = [latitude, longitude]
            
        this.#map = L.map('map').setView(coords, this.mapZoom);
            
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this.showForm.bind(this))

        this.#workouts.forEach(work => {
            this.renderWorkoutMarker(work);
        });
    }

    showForm(mapE) {
        this.#mapEvent = mapE;
            form.classList.remove('hidden');
            inputDistance.focus();
    }

    hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
        '';
        // Hide the Form
        form.getElementsByClassName.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid', 1000))
    }

    toggleElevationField() {
        inputElevation.closest('.form_row').classList.toggle('form_row--hidden');
        inputElevation.closest('.form_row').classList.toggle('form_row--hidden');
    }

    newWorkout(e) {
        const validInputs = (...inputs) => 
            inputs.every(inp => Number.isFinite(inp))
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // If activity is running, create running object
        if(type === 'running') {
            const cadence = + inputCadence.value;
        
            // Check if data is valid
            if(!validInputs(distance, duration, cadence) ||
               !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive number')
                workout = new Running([lat, lng], distance, duration, cadence);
        }

        // IF workout is cycling, create cycling object
        if(type === 'cycling') {
            const elevation = + inputElevation.value;
            // Check if data is valid
            if(!validInputs(distance, duration, cadence) ||
               !allPositive(distance, duration)
            )
                return alert('Inputs have to be positive number');
                workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        //Add new object to workout array
        this.#workouts.push(workout);

        // Render workout on map as a marker
        this.renderWorkoutMarker(workout);

        // Render workout on list
        this.renderWorkout(workout);
        
        // Hide form + clear input fields
        this.hideForm();
    }
    // Creates Workout Marker on the map using Leaflet
    renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}`
            )
            .openPopup();
    }
    // Adds workout to the UI
    renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;
        // Checking that workout is running
        if(workout.type === 'running')
         html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>
        `;
        // Checking that workout is cycling
        if(workout.type === 'cycling')
         html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>
         `;
        // Appending Workout to the Form Element
         form.insertAdjacentHTML('afterend', html);
        }
        // Focuses map on the clicked workout
        moveToWorkout(e) {
            const workoutEl = e.target.closest('.workout')

            if(!workoutEl) return;

            const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id
            );

            this.#map.setView(workout.coords, this.#mapZoom, {
                animate : true,
                pan: {
                    duration: 1,
                },
            })

        }
        
        // Setting workouts in Local Storage
        setLocalStorage() {
            localStorage.setItem('workouts', JSON.stringify(this.#workouts))
        }
        
        // Getting workouts from local storage
        getLocalStorage() {
                const data = JSON.parse(localStorage.getItem('workouts'));
                console.log(data)

                if(!data) return;

                this.#workouts = data;
                
                this.#workouts.forEach(work => {
                    this.renderWorkout(work);
                })
            }

            reset() {
                localStorage.removeItem('workouts');
                location.reload();
            }
};
    

const app = new App();
