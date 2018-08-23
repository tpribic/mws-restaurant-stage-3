let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get restaurant reviews from page URL.
 */
fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // review already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No review id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewByResID(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        fillReviewsHTML(null);
        return;
      }
      fillReviewsHTML();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favIcon = document.getElementById('favIcon');
  favIcon.innerHTML = '&#9733;';
  favIcon.classList.add('favIcon');

  if (restaurant.is_favorite === "true") {
    favIcon.classList.add('favorite');
    favIcon.setAttribute('aria-label', 'Remove to favorites');
  } else {
    favIcon.classList.add('not_favorite');
    favIcon.setAttribute('aria-label', 'Add to favorites');
  }

  favIcon.addEventListener('click', () => {
    const buttonclass = favIcon.classList;
    if (buttonclass.contains('not_favorite')) {
      DBHelper.addRestaurantToFavorites(restaurant.id, true, (error, response) => {
        favIcon.classList.remove('not_favorite');
        favIcon.classList.add('favorite');
        favIcon.setAttribute('aria-label', 'Add to favorites');
      });
    } else {
      DBHelper.addRestaurantToFavorites(restaurant.id, false, (error, response) => {
        favIcon.classList.remove('favorite');
        favIcon.classList.add('not_favorite');
        favIcon.setAttribute('aria-label', 'Remove from favorites');
      });
    }
  })

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant ${restaurant.photo_description}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromURL();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!'
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */

createReviewHTML = (review) => {
  const li = document.createElement('li');

  const name = document.createElement('h4');
  name.innerHTML = `From: ${review.name}`;
  li.appendChild(name);

  const date = document.createElement('h5');
  date.innerHTML = `${new Date(review.createdAt).toLocaleString()}`;
  li.appendChild(date);

  const rating = document.createElement('h4');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  if (!navigator.onLine) {
    const conn_status = document.createElement('p');
    conn_status.classList.add('offline_label')
    conn_status.innerHTML = "Comment Currently Offline"
    li.classList.add("reviews_offline")
    li.appendChild(conn_status);
  }

  return li;
}

reviewRestaurant = (restaurant = self.restaurant) => {
    event.preventDefault();
    let id = restaurant.id;
    let name = document.getElementById('review-name').value;
    let rating = document.querySelector('#review-rating option:checked').value;
    let comment = document.getElementById('review-comment').value;

    if (name != "" && comment != "") {
      let review = {
        restaurant_id: id,
        name: name,
        rating: rating,
        comments: comment,
        createdAt: new Date()
      }

    DBHelper.postReview(review);
    addReviewHTML(review);
    document.getElementById('review-form').reset();
  }
}

addReviewHTML = (review) => {
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    ul.insertBefore(createReviewHTML(review), ul.firstChild);
    container.appendChild(ul);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
