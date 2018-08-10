/* creating idb const/variables */

const DBNAME = 'mws-stage-3';
const KEY = 'restaurants';
const KEY2 = 'reviews'
const DBVER = 1;


/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  static dbPromise() {
    return idb.open(DBNAME, DBVER, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore(KEY, {
            keyPath: 'id'
          });
        case 1:
          const StoreReviews = upgradeDB.createObjectStore(KEY2, {
            keyPath: 'id'
          });
      }
    });
  }

  static storeRestaurants(restaurants){
    this.dbPromise()
    .then(db => {
       const tx = db.transaction([KEY], 'readwrite');
       restaurants.forEach(restaurant => {
         tx.objectStore(KEY).put(restaurant);
       })
       return tx.complete;
     });
  }

  static storeReviews(id, reviews) {
    this.dbPromise()
    .then(db => {
       const tx = db.transaction([KEY2], 'readwrite');
       reviews.forEach(review => {
         tx.objectStore(KEY2).put(review);
       })
       return tx.complete;
     });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    if (navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/restaurants`)
        .then(response => {
            if (response.status !== 200){
              console.log('There was a problem with status code: ' + response.status);
              return;
            }
            response.json()
            .then(data => {
              this.storeRestaurants(data);
              callback(null, data);
            });
          }
        )
        .catch(function(err){
          console.log('Fetch error!', err);
        })
    }
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    if (navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews`)
        .then(response => {
            if (response.status !== 200){
              console.log('There was a problem with status code: ' + response.status);
              return;
            }
            response.json()
            .then(data => {
              this.storeReviews(null, data);
              callback(null, data);
            });
          }
        )
        .catch(function(err){
          console.log('Fetch error!', err);
        })
    }
  }

  /**
   * Fetch reviews by restaurant ID.
   */
  static fetchReviewByResID(id, callback) {
    if (navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        DBHelper.StoreReviews(id, reviews);
        callback(null, reviews);
      })
      .catch(err => {
        const error = `Ups. An error occured with status of ${err.status}`;
        callback(error, null);
      })
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/webp/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
