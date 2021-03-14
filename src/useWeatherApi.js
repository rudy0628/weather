import { useState, useEffect, useCallback } from "react";

const fetchWeatherForecast = (locationName) => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-307EDE5F-4CAA-4818-8CD9-C2C9EA00B32C&locationName=${locationName}`
  )
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.location[0];
      const weatherElements = locationData.weatherElement.reduce(
        (neededElements, item) => {
          if (["Wx", "PoP", "CI"].includes(item.elementName)) {
            neededElements[item.elementName] = item.time[0].parameter;
          }
          return neededElements;
        },
        {}
      );

      return {
        description: weatherElements.Wx.parameterName,
        weatherCode: weatherElements.Wx.parameterValue,
        rainPossibility: weatherElements.PoP.parameterName,
        comfortability: weatherElements.CI.parameterName
      };
    });
};

const fetchCurrentWeather = (cityName) => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-307EDE5F-4CAA-4818-8CD9-C2C9EA00B32C&locationName=${cityName}`
  )
    .then((response) => response.json())
    .then((data) => {
      // STEP 1：定義 `locationData` 把回傳的資料中會用到的部分取出來
      const locationData = data.records.location[0];

      // STEP 2：將風速（WDSD）、氣溫（TEMP）和濕度（HUMD）的資料取出
      const weatherElements = locationData.weatherElement.reduce(
        (neededElements, item) => {
          if (["WDSD", "TEMP", "HUMD"].includes(item.elementName)) {
            neededElements[item.elementName] = item.elementValue;
          }
          return neededElements;
        },
        {}
      );

      // STEP 3：要使用到 React 組件中的資料
      return {
        observationTime: locationData.time.obsTime,
        locationName: locationData.locationName,
        description: "多雲時晴",
        temperature: weatherElements.TEMP,
        windSpeed: weatherElements.WDSD,
        humid: weatherElements.HUMD
      };
    });
};

const useWeatherApi = (currentLocation) => {
  // STEP 2：將傳入的 currentLocation 透過解構賦值取出 locationName 和 cityName
  const { locationName, cityName } = currentLocation;
  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    locationName: "",
    humid: 0,
    temperature: 0,
    windSpeed: 0,
    description: "",
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: "",
    isLoading: true
  });

  const fetchData = useCallback(() => {
    // STEP 3：把原本的 fetchData 改名為 fetchingData 放到 useCallback 的函式內
    const fetchingData = async () => {
      const [currentWeather, weatherForecast] = await Promise.all([
        fetchCurrentWeather(locationName),
        fetchWeatherForecast(cityName)
      ]);

      setWeatherElement({
        ...currentWeather,
        ...weatherForecast,
        isLoading: false
      });
    };

    setWeatherElement((prevState) => ({
      ...prevState,
      isLoading: true
    }));
    // STEP 4：記得要呼叫 fetchingData 這個方法
    fetchingData();
    // STEP 5：因為 fetchingData 沒有相依到 React 組件中的資料狀態，所以 dependencies 陣列中不帶入元素
  }, [locationName, cityName]);

  // STEP 4：把原本 useEffect 的部分搬移進來
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // STEP 5：把要給其他 React 組件使用的資料或方法回傳出去
  return [weatherElement, fetchData];
};

export default useWeatherApi;
