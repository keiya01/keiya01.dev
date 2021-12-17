import { getTTFB } from "web-vitals";

const recordWebVitals = () => {
  // TODO: send metrics to firebase
  getTTFB((metric) => {
    console.log(`${metric.name}: ${metric.value}`);
  });
};

recordWebVitals();
