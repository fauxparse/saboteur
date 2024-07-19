import { Loader } from "@googlemaps/js-api-loader";

const loader = new Loader({
  apiKey: "AIzaSyAb1lIuwWXjsWNc07idwCDz0mjU_xfBqZg",
});

export const nearestCity = () =>
  new Promise<string>((resolve) => {
    loader
      .importLibrary("geocoding")
      .then(({ Geocoder }: google.maps.GeocodingLibrary) => {
        const geocoder = new Geocoder();

        navigator.geolocation.getCurrentPosition(({ coords }) => {
          console.log(coords);
          geocoder
            .geocode({
              location: { lat: coords.latitude, lng: coords.longitude },
            })
            .then((response) => {
              console.log(response.results);
              const localities = response.results.map(
                (r) =>
                  r.address_components.find((c) => c.types.includes("locality"))
                    ?.long_name
              );
              if (localities[0]) resolve(localities[0]);
            })
            .catch(console.error);
        });
      });
  });
