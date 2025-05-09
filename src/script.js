const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value
  );
const formatPercentage = (value) => `${value.toFixed(2)}%`;
const getRandomValue = (base, variance) =>
  base + (Math.random() - 0.5) * variance;

const balanceData = {
  "1D": Array.from({ length: 24 }, (_, i) => ({
    date: new Date(2024, 7, 30, i, 0),
    value: getRandomValue(10000, 1000),
  })),
  "1W": Array.from({ length: 7 }, (_, i) => ({
    date: new Date(2024, 7, 24 + i),
    value: getRandomValue(9500, 1500),
  })),
  "1M": Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 7, i + 1),
    value: getRandomValue(9000, 2000),
  })),
  "1Y": Array.from({ length: 12 }, (_, i) => ({
    date: new Date(2024, i, 1),
    value: getRandomValue(8000, 3000),
  })),
  ALL: Array.from({ length: 5 }, (_, i) => ({
    date: new Date(2020 + i, 0, 1),
    value: getRandomValue(5000, 6000),
  })),
};

const salesData = Array.from({ length: 12 }, () => getRandomValue(500, 200));
const exchangeData = Array.from({ length: 12 }, () => getRandomValue(300, 150));
const greedData = [
  { label: "Greed", value: 75 },
  { label: "Neutral", value: 15 },
  { label: "Fear", value: 10 },
];

function createBalanceChart(data) {
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const width =
    document.getElementById("balanceChart").clientWidth -
    margin.left -
    margin.right;
  const height =
    document.getElementById("balanceChart").clientHeight -
    margin.top -
    margin.bottom;

  d3.select("#balanceChart").selectAll("*").remove();

  const svg = d3
    .select("#balanceChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const defs = svg.append("defs");

  const filter = defs.append("filter").attr("id", "glow");

  filter
    .append("feGaussianBlur")
    .attr("stdDeviation", "3.5")
    .attr("result", "coloredBlur");

  const feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode").attr("in", "coloredBlur");

  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  const x = d3
    .scaleTime()
    .range([0, width])
    .domain(d3.extent(data, (d) => d.date));

  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([
      d3.min(data, (d) => d.value) * 0.95,
      d3.max(data, (d) => d.value) * 1.05,
    ]);

  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(height)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const gradient = defs
    .append("linearGradient")
    .attr("id", "area-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y(d3.min(data, (d) => d.value)))
    .attr("x2", 0)
    .attr("y2", y(d3.max(data, (d) => d.value)));

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "rgba(149, 117, 205, 0.1)");

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "rgba(149, 117, 205, 0.4)");

  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#chart-background)");

  svg
    .append("path")
    .datum(data)
    .attr("fill", "url(#area-gradient)")
    .attr("d", area);

  const path = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#9575cd")
    .attr("stroke-width", 2)
    .attr("d", line)
    .style("filter", "url(#glow)");

  const pathLength = path.node().getTotalLength();
  path
    .attr("stroke-dasharray", pathLength + " " + pathLength)
    .attr("stroke-dashoffset", pathLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

  svg
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value))
    .attr("r", 5)
    .style("fill", "#ffffff")
    .style("stroke", "#9575cd")
    .style("stroke-width", 2)
    .style("filter", "url(#glow)");

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
    .selectAll("text")
    .style("fill", "#ffffff");

  svg
    .append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${d / 1000}k`)
    )
    .selectAll("text")
    .style("fill", "#ffffff");

  const tooltip = d3.select("#tooltip");
  const bisect = d3.bisector((d) => d.date).left;

  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", function (event) {
      const [xPos] = d3.pointer(event, this);
      const x0 = x.invert(xPos);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

      tooltip
        .style("display", "block")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .html(
          `Date: ${d3.timeFormat("%b %d, %Y")(
            d.date
          )}<br>Value: ${formatCurrency(d.value)}`
        );
    })
    .on("mouseout", () => tooltip.style("display", "none"));
}

function createBarChart(containerId, data, color) {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width =
    document.getElementById(containerId).clientWidth -
    margin.left -
    margin.right;
  const height =
    document.getElementById(containerId).clientHeight -
    margin.top -
    margin.bottom;

  d3.select(`#${containerId}`).selectAll("*").remove();

  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().range([0, width]).padding(0.1);

  const y = d3.scaleLinear().range([height, 0]);

  x.domain(data.map((d, i) => i));
  y.domain([0, d3.max(data)]);

  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d, i) => x(i))
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", color)
    .attr("rx", 5)
    .attr("ry", 5)
    .transition()
    .duration(1000)
    .attr("y", (d) => y(d))
    .attr("height", (d) => height - y(d));

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(() => ""))
    .selectAll("text")
    .style("fill", "#ffffff");

  svg
    .append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${d}`)
    )
    .selectAll("text")
    .style("fill", "#ffffff");

  const tooltip = d3.select("#tooltip");

  svg
    .selectAll(".bar")
    .on("mousemove", function (event, d) {
      tooltip
        .style("display", "block")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .html(`Value: ${formatCurrency(d)}`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));
}

function createGreedIndexChart(data) {
  const width = document.getElementById("greedIndexChart").clientWidth;
  const height = document.getElementById("greedIndexChart").clientHeight;
  const radius = Math.min(width, height) / 2;

  d3.select("#greedIndexChart").selectAll("*").remove();

  const svg = d3
    .select("#greedIndexChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.label))
    .range(["#9c27b0", "#7e57c2", "#5e35b1"]);

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  const arc = d3
    .arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius);

  const arcs = svg
    .selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.label))
    .style("stroke", "#fff")
    .style("stroke-width", "2px");

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.3em")
    .attr("class", "greed-index-text")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("fill", "#ffffff")
    .text(`${data[0].value.toFixed(0)}%`);

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.5em")
    .style("font-size", "14px")
    .style("fill", "#4caf50")
    .text(`${data[0].value > 0 ? "+" : ""}${formatPercentage(data[0].value)}`);

  const tooltip = d3.select("#tooltip");

  arcs
    .on("mousemove", function (event, d) {
      tooltip
        .style("display", "block")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .html(`${d.data.label}: ${d.data.value}%`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));
}

function updateCharts(timePeriod = "1D") {
  createBalanceChart(balanceData[timePeriod]);
  createBarChart(
    "salesChart",
    salesData.map((value) => getRandomValue(value, 100)),
    "#7986cb"
  );
  createBarChart(
    "exchangeChart",
    exchangeData.map((value) => getRandomValue(value, 100)),
    "#3949ab"
  );
  createGreedIndexChart(
    greedData.map((d) => ({ ...d, value: getRandomValue(d.value, 5) }))
  );

  document.getElementById("totalBalance").textContent = formatCurrency(
    balanceData[timePeriod][balanceData[timePeriod].length - 1].value
  ).replace("$", "");
  document.getElementById("balanceChange").textContent = formatCurrency(
    1169.28
  ).replace("$", "");
  document.getElementById("balanceChangePercent").textContent =
    formatPercentage(12.4).replace("%", "");
  document.getElementById("currentPrice").textContent = formatCurrency(
    3046.0
  ).replace("$", "");
  document.getElementById("priceChange").textContent = formatCurrency(
    161.24
  ).replace("$", "");
  document.getElementById("priceChangePercent").textContent = formatPercentage(
    5.3
  ).replace("%", "");
  document.getElementById("salesValue").textContent = formatCurrency(
    1062.56
  ).replace("$", "");
  document.getElementById("salesChangePercent").textContent = formatPercentage(
    40.8
  ).replace("%", "");
  document.getElementById("exchangeValue").textContent = formatCurrency(
    491.2
  ).replace("$", "");
  document.getElementById("exchangeChangePercent").textContent =
    formatPercentage(19.5).replace("%", "");
  document.getElementById("greedIndexValue").textContent =
    greedData[0].value.toFixed(0);
  document.getElementById("greedIndexChange").textContent =
    formatPercentage(10.3);
}

const tokenData = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: 31573.31,
    balance: 4.11,
    marketCap: 591831951441,
    volume: 18632960820,
    circSupply: 21.68,
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: 5173.31,
    balance: 35.11,
    marketCap: 696997743,
    volume: 17397543,
    circSupply: 41.62,
  },
];

function updateTokenTable() {
  const tbody = document.getElementById("tokenTableBody");
  tbody.innerHTML = "";

  tokenData.forEach((token) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="py-2">
                <div class="flex items-center">
                    <img src="https://cryptologos.cc/logos/${token.name.toLowerCase()}-${token.symbol.toLowerCase()}-logo.png" alt="${
      token.name
    }" class="w-6 h-6 mr-2">
                    ${token.name} (${token.symbol})
                </div>
            </td>
            <td class="text-right">${formatCurrency(token.price)}</td>
            <td class="text-right">${token.balance} ${token.symbol}</td>
            <td class="text-right">${formatCurrency(token.marketCap)}</td>
            <td class="text-right">${formatCurrency(token.volume)}</td>
            <td class="text-right">
                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div class="bg-purple-600 h-2.5 rounded-full" style="width: ${
                      token.circSupply
                    }%"></div>
                </div>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

document.getElementById("swapButton").addEventListener("click", function () {
  const inputCurrency = document.getElementById("swapInputCurrency");
  const outputCurrency = document.getElementById("swapOutputCurrency");
  [inputCurrency.value, outputCurrency.value] = [
    outputCurrency.value,
    inputCurrency.value,
  ];
  calculateSwap("swapInput", "swapOutput");
});

document
  .getElementById("swapFullButton")
  .addEventListener("click", function () {
    const inputCurrency = document.getElementById("swapFullInputCurrency");
    const outputCurrency = document.getElementById("swapFullOutputCurrency");
    [inputCurrency.value, outputCurrency.value] = [
      outputCurrency.value,
      inputCurrency.value,
    ];
    calculateSwap("swapFullInput", "swapFullOutput");
  });

function calculateSwap(inputId, outputId) {
  const inputCurrency = document.getElementById(inputId + "Currency").value;
  const outputCurrency = document.getElementById(outputId + "Currency").value;
  const inputValue = parseFloat(document.getElementById(inputId).value);

  let conversionRate = 11500;

  if (inputCurrency === "bnb" && outputCurrency === "eth") {
    conversionRate = 0.0036;
  }

  const outputValue = inputValue * conversionRate;
  document.getElementById(outputId).value = outputValue.toFixed(5);
}

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(".nav-link.active").classList.remove("active");
    this.classList.add("active");
    const targetPage = this.dataset.page;
    document.querySelectorAll(".page-content").forEach((page) => {
      page.classList.add("hidden");
    });
    document.getElementById(`${targetPage}-page`).classList.remove("hidden");
  });
});

document.querySelectorAll(".time-btn").forEach((button) => {
  button.addEventListener("click", function () {
    document.querySelector(".time-btn.active").classList.remove("active");
    this.classList.add("active");
    updateCharts(this.dataset.period);
  });
});

const connectWalletBtn = document.getElementById("connectWalletBtn");
const connectWalletModal = document.getElementById("connectWalletModal");
const closeWalletModal = document.getElementById("closeWalletModal");

connectWalletBtn.addEventListener("click", () => {
  connectWalletModal.classList.add("active");
  connectWalletModal.classList.remove("hidden");
});

closeWalletModal.addEventListener("click", () => {
  connectWalletModal.classList.remove("active");
  connectWalletModal.classList.add("hidden");
});

connectWalletModal.addEventListener("click", (event) => {
  if (event.target === connectWalletModal) {
    connectWalletModal.classList.remove("active");
    connectWalletModal.classList.add("hidden");
  }
});

["swapInput", "swapFullInput"].forEach((id) => {
  document
    .getElementById(id)
    .addEventListener("input", () =>
      calculateSwap(id, id.replace("Input", "Output"))
    );
  document
    .getElementById(id + "Currency")
    .addEventListener("change", () =>
      calculateSwap(id, id.replace("Input", "Output"))
    );
  document
    .getElementById(id.replace("Input", "Output") + "Currency")
    .addEventListener("change", () =>
      calculateSwap(id, id.replace("Input", "Output"))
    );
});

updateCharts();
updateTokenTable();

document
  .getElementById("saveSettingsBtn")
  .addEventListener("click", function () {
    const language = document.getElementById("language").value;
    const currency = document.getElementById("currency").value;
    const theme = document.getElementById("theme").value;
    const notifications = document.querySelector(
      'input[type="checkbox"]'
    ).checked;

    console.log("Settings saved:", {
      language,
      currency,
      theme,
      notifications,
    });
    alert("Settings saved successfully!");
  });

window.addEventListener("resize", () => {
  updateCharts(document.querySelector(".time-btn.active").dataset.period);
});

d3.select("body").append("div").attr("id", "tooltip").attr("class", "tooltip");

const marketData = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: 31573.31,
    change24h: 2.5,
    marketCap: 591831951441,
    volume: 18632960820,
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: 5173.31,
    change24h: -1.2,
    marketCap: 696997743,
    volume: 17397543,
  },
];

function updateMarketTable() {
  const tbody = document.getElementById("marketTableBody");
  tbody.innerHTML = "";

  marketData.forEach((token) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="py-2">
                <div class="flex items-center">
                    <img src="https://cryptologos.cc/logos/${token.name.toLowerCase()}-${token.symbol.toLowerCase()}-logo.png" alt="${
      token.name
    }" class="w-6 h-6 mr-2">
                    ${token.name} (${token.symbol})
                </div>
            </td>
            <td class="text-right">${formatCurrency(token.price)}</td>
            <td class="text-right ${
              token.change24h >= 0 ? "text-green-400" : "text-red-400"
            }">${token.change24h}%</td>
            <td class="text-right">${formatCurrency(token.marketCap)}</td>
            <td class="text-right">${formatCurrency(token.volume)}</td>
            <td class="text-right">
                <div class="h-8 w-20 inline-block">
                    <div class="bg-purple-600 h-full w-full rounded"></div>
                </div>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

const walletData = {
  assets: [
    { name: "Bitcoin", symbol: "BTC", balance: 0.5, value: 15786.65 },
    { name: "Ethereum", symbol: "ETH", balance: 2.3, value: 11898.61 },
  ],
  transactions: [
    {
      type: "Buy",
      asset: "BTC",
      amount: 0.1,
      price: 31573.31,
      date: "2023-08-30",
    },
    {
      type: "Sell",
      asset: "ETH",
      amount: 0.5,
      price: 5173.31,
      date: "2023-08-29",
    },
  ],
};

function updateWalletPage() {
  const assetList = document.getElementById("assetList");
  const transactionList = document.getElementById("transactionList");

  assetList.innerHTML = "";
  walletData.assets.forEach((asset) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="https://cryptologos.cc/logos/${asset.name.toLowerCase()}-${asset.symbol.toLowerCase()}-logo.png" alt="${
      asset.name
    }" class="w-6 h-6 mr-2">
                    <span>${asset.name}</span>
                </div>
                <div class="text-right">
                    <div>${asset.balance} ${asset.symbol}</div>
                    <div class="text-sm text-gray-400">${formatCurrency(
                      asset.value
                    )}</div>
                </div>
            </div>
        `;
    assetList.appendChild(li);
  });

  transactionList.innerHTML = "";
  walletData.transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <div class="${
                      transaction.type === "Buy"
                        ? "text-green-400"
                        : "text-red-400"
                    }">${transaction.type} ${transaction.asset}</div>
                    <div class="text-sm text-gray-400">${transaction.date}</div>
                </div>
                <div class="text-right">
                    <div>${transaction.amount} ${transaction.asset}</div>
                    <div class="text-sm text-gray-400">${formatCurrency(
                      transaction.amount * transaction.price
                    )}</div>
                </div>
            </div>
        `;
    transactionList.appendChild(li);
  });
}

function initializePages() {
  updateCharts();
  updateTokenTable();
  updateMarketTable();
  updateWalletPage();
}

document.addEventListener("DOMContentLoaded", initializePages);

document.querySelector("nav").addEventListener("click", function (e) {
  if (e.target.classList.contains("nav-link")) {
    e.preventDefault();
    document.querySelector(".nav-link.active").classList.remove("active");
    e.target.classList.add("active");
    const targetPage = e.target.dataset.page;
    document.querySelectorAll(".page-content").forEach((page) => {
      page.classList.add("hidden");
    });
    document.getElementById(`${targetPage}-page`).classList.remove("hidden");

    switch (targetPage) {
      case "dashboard":
        updateCharts();
        updateTokenTable();
        break;
      case "swap":
        break;
      case "markets":
        updateMarketTable();
        break;
      case "wallet":
        updateWalletPage();
        break;
      case "settings":
        break;
    }
  }
});

window.addEventListener("error", function (e) {
  console.error("An error occurred:", e.error);
});

const debouncedResize = debounce(() => {
  updateCharts(document.querySelector(".time-btn.active").dataset.period);
}, 250);

window.addEventListener("resize", debouncedResize);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.querySelectorAll("button, a, input, select").forEach((el) => {
  if (!el.getAttribute("aria-label") && !el.innerText) {
    el.setAttribute("aria-label", el.id || el.name || "Interactive element");
  }
});

console.log("Crypto dashboard script loaded successfully");
