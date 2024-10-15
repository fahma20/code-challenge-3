function fetchMovieDetails(filmId) {
    fetch(`http://localhost:3000/films/${filmId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Unable to respond');
            }
            return response.json();
        })
        .then(movie => {
            updateMovieDetails(movie);
        })
        .catch(error => {
            console.error('Error fetching the movie data:', error);
        });
}

function updateMovieDetails(movie) {
    console.log('Updating movie details:', movie);
    document.getElementById('poster').src = movie.poster;
    document.getElementById('title').innerText = movie.title;
    document.getElementById('runtime').innerText = `${movie.runtime} minutes`;
    document.getElementById('showtime').innerText = movie.showtime;

    const availableTickets = movie.capacity - movie.tickets_sold;
    document.getElementById('ticket-num').innerText = availableTickets; // Display available tickets
    document.getElementById('film-info').innerText = movie.description;
}

document.addEventListener('DOMContentLoaded', () => {
    Films();
});

function Films() {
    fetch('http://localhost:3000/films')
        .then(response => response.json())
        .then(films => {
            const filmsList = document.getElementById('films');
            filmsList.innerHTML = ''; 

            for (const film of films) {
                const filmItem = createFilmItem(film);
                filmsList.appendChild(filmItem); 
            }

            filmsList.querySelectorAll('.buy-ticket').forEach(button => {
                button.addEventListener('click', buyTicket);
            });
            filmsList.querySelectorAll('.delete-film').forEach(button => {
                button.addEventListener('click', deleteFilm);
            });
        });
}

function createFilmItem(film) {
    const filmLi = document.createElement('li');
    filmLi.className = 'film item';
    filmLi.dataset.id = film.id; 
    filmLi.dataset.ticketsSold = film.tickets_sold; // Ensure this is set
    filmLi.dataset.capacity = film.capacity; // Ensure this is set

    const titleSpan = document.createElement('span');
    titleSpan.innerText = film.title;

    titleSpan.addEventListener('click', () => {
        fetchMovieDetails(film.id);
    });

    const buyButton = document.createElement('button');
    buyButton.className = 'buy-ticket';
    buyButton.innerText = 'Buy Ticket';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-film';
    deleteButton.innerText = 'Delete';

    filmLi.appendChild(titleSpan);
    filmLi.appendChild(buyButton);
    filmLi.appendChild(deleteButton);

    return filmLi; 
}

function buyTicket(event) {
    const filmLi = event.target.closest('li');
    const filmId = filmLi.dataset.id;
    let ticketsSold = parseInt(filmLi.dataset.ticketsSold);
    const capacity = parseInt(filmLi.dataset.capacity);
    
    console.log(`Trying to buy ticket for film ID: ${filmId}`);
    console.log(`Current tickets sold: ${ticketsSold}, Capacity: ${capacity}`);

    if (ticketsSold < capacity) {
        ticketsSold += 1; 
        
        
        fetch(`http://localhost:3000/films/${filmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tickets_sold: ticketsSold })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update tickets sold');
            }
            return response.json();
        })
        .then(updatedFilm => {
            console.log('Updated film data:', updatedFilm);
            filmLi.dataset.ticketsSold = updatedFilm.tickets_sold; // Update the dataset
            
            
            return fetch('http://localhost:3000/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ film_id: filmId, number_of_tickets: 1 })
            });
        })
        .then(ticketResponse => {
            if (!ticketResponse.ok) {
                throw new Error('Failed to create ticket');
            }
            return ticketResponse.json();
        })
        .then(ticketData => {
            console.log('Created ticket data:', ticketData);
            updateMovieDetails({ ...updatedFilm, tickets_sold: updatedFilm.tickets_sold });
            
            if (updatedFilm.tickets_sold >= updatedFilm.capacity) {
                event.target.textContent = 'Sold Out';
                filmLi.classList.add('sold-out');
            }
        })
        .catch(error => {
            console.error('Error in ticket purchase process:', error);
        });
    } else {
        alert("Sold Out");
    }
}

function deleteFilm(event) {
    const filmLi = event.target.closest('li');
    const filmId = filmLi.dataset.id;

    fetch(`http://localhost:3000/films/${filmId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete film');
        }
        filmLi.remove();
    })
    .catch(error => {
        console.error('Unable to delete the film:', error);
    });
}