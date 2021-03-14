import React, { useState, useEffect, useMemo } from "react";
// STEP 1：載入 emotion 的 styled 套件
import styled from "@emotion/styled";
// 載入圖示
import { ThemeProvider } from "emotion-theming"; //主題
import WeatherCard from "./WeatherCard";
import WeatherSetting from "./WeatherSetting";
// STEP 1：匯入日出日落資料
import sunriseAndSunsetData from "./sunrise-sunset.json";
// STEP 1：載入 useWeatherApi Hook
import useWeatherApi from "./useWeatherApi";
import { findLocation } from "./utils";

// STEP 2：定義帶有 styled 的 compoment
const Container = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const theme = {
  light: {
    backgroundColor: "#ededed",
    foregroundColor: "#f9f9f9",
    boxShadow: "0 1px 3px 0 #999999",
    titleColor: "#212121",
    temperatureColor: "#757575",
    textColor: "#828282"
  },
  dark: {
    backgroundColor: "#1F2022",
    foregroundColor: "#121416",
    boxShadow:
      "0 1px 4px 0 rgba(12, 12, 13, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.15)",
    titleColor: "#f9f9fa",
    temperatureColor: "#dddddd",
    textColor: "#cccccc"
  }
};

const getMoment = (locationName) => {
  // STEP 2：從日出日落時間中找出符合的地區
  const location = sunriseAndSunsetData.find(
    (data) => data.locationName === locationName
  );
  // STEP 3：找不到的話則回傳 null
  if (!location) return null;

  // STEP 4：取得當前時間
  const now = new Date();

  // STEP 5：將當前時間以 "2019-10-08" 的時間格式呈現
  const nowDate = Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(now)
    .replace(/\//g, "-");
  // STEP 6：從該地區中找到對應的日期
  const locationDate =
    location.time && location.time.find((time) => time.dataTime === nowDate);
  // STEP 7：將日出日落以及當前時間轉成時間戳記（TimeStamp）
  const sunriseTimestamp = new Date(
    `${locationDate.dataTime} ${locationDate.sunrise}`
  ).getTime();
  const sunsetTimestamp = new Date(
    `${locationDate.dataTime} ${locationDate.sunset}`
  ).getTime();
  const nowTimeStamp = now.getTime();

  // STEP 8：若當前時間介於日出和日落中間，則表示為白天，否則為晚上
  return sunriseTimestamp <= nowTimeStamp && nowTimeStamp <= sunsetTimestamp
    ? "day"
    : "night";
};

// STEP 3：把上面定義好的 styled-component 當成組件使用
const WeatherApp = () => {
  // STEP 1：從 localStorage 取出 cityName，並取名為 storageCity
  const storageCity = localStorage.getItem("cityName");
  const [currentCity, setCurrentCity] = useState(storageCity || "臺北市");
  // STEP 3：根據 currentCity 來找出對應到不同 API 時顯示的地區名稱，找到的地區取名為 locationInfo
  const currentLocation = findLocation(currentCity) || {};
  const [weatherElement, fetchData] = useWeatherApi(currentLocation);
  const [currentTheme, setCurrentTheme] = useState("light");
  const [currentPage, setCurrentPage] = useState("WeatherCard");

  // STEP 3：透過 useMemo 避免每次都須重新計算取值，記得帶入 dependencies
  const moment = useMemo(() => getMoment(currentLocation.sunriseCityName), [
    currentLocation.sunriseCityName
  ]);

  // STEP 3-1：當 currentCity 有改變的時候，儲存到 localStorage 中
  useEffect(() => {
    localStorage.setItem("cityName", currentCity);
    // STEP 3-2：dependencies 中放入 currentCity
  }, [currentCity]);

  useEffect(() => {
    setCurrentTheme(moment === "day" ? "light" : "dark");
    // 記得把 moment 放入 dependencies 中
  }, [moment]);

  return (
    <ThemeProvider theme={theme[currentTheme]}>
      <Container>
        {/* STEP 2：利用條件渲染的方式決定要呈現哪個組件 */}
        {currentPage === "WeatherCard" && (
          <WeatherCard
            // STEP 5：把縣市名稱傳入 WeatherCard 中用以顯示
            cityName={currentLocation.cityName}
            weatherElement={weatherElement}
            moment={moment}
            fetchData={fetchData}
            setCurrentPage={setCurrentPage}
          />
        )}
        {/* STEP 2：使用 WeatherSetting */}
        {currentPage === "WeatherSetting" && (
          <WeatherSetting
            // STEP 6：把縣市名稱傳入 WeatherSetting 中當作表單「地區」欄位的預設值
            cityName={currentLocation.cityName}
            // STEP 7：把 setCurrentCity 傳入，讓 WeatherSetting 可以修改 currentCity
            setCurrentCity={setCurrentCity}
            setCurrentPage={setCurrentPage}
          />
        )}
      </Container>
    </ThemeProvider>
  );
};

export default WeatherApp;
