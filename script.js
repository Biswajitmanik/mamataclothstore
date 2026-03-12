const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -30px 0px",
  }
);

revealItems.forEach((item) => observer.observe(item));

const shopStatusNode = document.getElementById("shop-status");

const dayNameByIndex = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const dayIndexByShortName = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const parseTimeToMinutes = (value) => {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const formatTime12Hour = (value) => {
  const [hourText, minuteText] = value.split(":");
  const hour24 = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) return value;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = ((hour24 + 11) % 12) + 1;
  const minuteTextPadded = String(minute).padStart(2, "0");
  return `${hour12}:${minuteTextPadded} ${period}`;
};

const getTimePartsForTimezone = (timeZone) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());

    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);

    if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return {
      dayIndex: dayIndexByShortName[weekday],
      minutes: hour * 60 + minute,
    };
  } catch (error) {
    return null;
  }
};

const setShopStatus = (message, isOpen) => {
  if (!shopStatusNode) return;
  shopStatusNode.textContent = message;
  shopStatusNode.classList.toggle("is-open", isOpen);
  shopStatusNode.classList.toggle("is-closed", !isOpen);
};

const updateShopStatus = () => {
  if (!shopStatusNode) return;

  const openTime = shopStatusNode.dataset.openTime || "08:00";
  const closeTime = shopStatusNode.dataset.closeTime || "21:30";
  const timeZone = shopStatusNode.dataset.timezone || "Asia/Kolkata";
  const openDays = (shopStatusNode.dataset.openDays || "1,2,3,4,5,6")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    .sort((a, b) => a - b);

  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const now = getTimePartsForTimezone(timeZone);

  if (
    openDays.length === 0 ||
    openMinutes === null ||
    closeMinutes === null ||
    now === null ||
    typeof now.dayIndex !== "number"
  ) {
    setShopStatus("Store hours unavailable.", false);
    return;
  }

  const isOpenDay = openDays.includes(now.dayIndex);
  let isOpenNow = false;

  if (openMinutes < closeMinutes) {
    isOpenNow = isOpenDay && now.minutes >= openMinutes && now.minutes < closeMinutes;
  } else {
    const prevDay = (now.dayIndex + 6) % 7;
    isOpenNow =
      (isOpenDay && now.minutes >= openMinutes) ||
      (openDays.includes(prevDay) && now.minutes < closeMinutes);
  }

  if (isOpenNow) {
    setShopStatus(`Open Now | Closes at ${formatTime12Hour(closeTime)}`, true);
    return;
  }

  if (isOpenDay && now.minutes < openMinutes) {
    setShopStatus(`Closed Now | Opens today at ${formatTime12Hour(openTime)}`, false);
    return;
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (now.dayIndex + offset) % 7;
    if (!openDays.includes(day)) continue;

    const dayLabel = offset === 1 ? "tomorrow" : dayNameByIndex[day];
    setShopStatus(`Closed Now | Opens ${dayLabel} at ${formatTime12Hour(openTime)}`, false);
    return;
  }

  setShopStatus("Closed Now", false);
};

if (shopStatusNode) {
  updateShopStatus();
  setInterval(updateShopStatus, 60 * 1000);
}
