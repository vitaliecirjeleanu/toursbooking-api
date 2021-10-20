const axios = require('axios');

const AppError = require('./appError');

const getCoordsForAddress = async address => {
  //////////////////////////////////
  //THIS IS FOR MAPBOX API GEOCODING
  ///////////////////////////////////

  const res = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${process.env.MAPBOX_API_KEY}`
  );

  const data = res.data;
  if (!data || data.features.length === 0) {
    throw new AppError(
      `Could not find location for the specified address: ${address}`,
      422
    );
  }

  const coordinates = data.features[0].geometry.coordinates;
  return coordinates;
};

//////////////////////////////////
//THIS IS FOR GOOGLE API GEOCODING
///////////////////////////////////
// const res = await axios.get(
//   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//     address
//   )}&key=${process.env.GOOGLE_API_KEY}`
// );
// const data = res.data;
// if (!data || data.status === 'ZERO_RESULTS') {
//   throw new AppError(
//     `Could not find location for the specified address: ${address}`,
//     422
//   );
// }
// const coordinates = data.results[0].geometry.location;
// return coordinates;
// };

module.exports = getCoordsForAddress;
