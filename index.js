const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { parse } = require("node-html-parser");

const app = express();
app.use(bodyParser.json());

app.get('/',(req,res)=>{
  console.log("ping");
  res.status(200).send("Running");
})

app.get("/getInfo", async (req, res) => {
  console.log("info");
  try {
    //NSE
    const symbol = req.query.symbol;
    const responseNSE = await axios.get(
      `http://www1.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol=${symbol}`
    );
    const root = parse(responseNSE.data);
    const nseData = JSON.parse(
      root.getElementById("responseDiv").childNodes[0]._rawText
    );

    //BSE
    const scripcode = req.query.scripcode;

    const responseBSE1 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/EQPeerGp/w?scripcode=${scripcode}&scripcomare=`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse1Data = responseBSE1.data;

    const responseBSE2 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/TabResults_PAR/w?scripcode=${scripcode}&tabtype=RESULTS`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse2Data = JSON.parse(responseBSE2.data);

    const responseBSE3 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/HighLow/w?Type=EQ&flag=C&scripcode=${scripcode}`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse3Data = responseBSE3.data;

    const responseBSE4 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w?scripcode=${scripcode}&flag=0&fromdate=&todate=&seriesid=`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse4Data = responseBSE4.data;
    bse4Data.Data = JSON.parse(bse4Data.Data);

    const responseBSE5 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripcode}&seriesid=  `,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse5Data = responseBSE5.data;

    const responseBSE6 = await axios({
      method: "get",
      url: `https://api.bseindia.com/BseIndiaAPI/api/ComHeader/w?quotetype=EQ&scripcode=${scripcode}&seriesid=`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse6Data = responseBSE6.data;

    const responseBSE7 = await axios({
      method: "get",
      url: `https://www.bseindia.com/stock-share-price/-/-/${scripcode}/`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
      },
    });
    const bse7Data = responseBSE7.data;

    // FINAL RESULT
    const result = {
      stockInfo: {
        Industry: "",
        "Mkt Cap": "",
        "Face Value": nseData.data[0].faceValue,
        "ISIN No": nseData.data[0].isinCode,
        Bookclosure: "", // ??? record date
        "Market Lot": "",
        "BSE Code ": scripcode,
        "NSE Code": nseData.data[0].symbol + nseData.data[0].series,
      },
      nse: {
        "Last Traded Price": "", // ??? close price,sell price1
        "Last Traded Date": nseData.tradedDate,
        "Last Traded Time": "",
        Change: "",
        "Day's Open": nseData.data[0].open,
        "Previous Close": nseData.data[0].previousClose,
        "Day's High": nseData.data[0].dayHigh,
        "Day's Low": nseData.data[0].dayLow,
        Volume: nseData.data[0].quantityTraded,
        Value: nseData.data[0].totalTradedValue,
        "Bid Price": "",
        "Bid Quantity": "",
        "Offer Price": "", // ??? close price, sell price1
        "Offer Quantity": "", // ??? totalSellQuantity, sellQuantity1
        "Exchange Code": nseData.data[0].symbol + nseData.data[0].series,
        Exchange: "",
        HIGH: nseData.data[0].high52,
        "HIGH DATE": nseData.data[0].cm_adj_high_dt,
        LOW: nseData.data[0].low52,
        "LOW DATE": nseData.data[0].cm_adj_low_dt,
      },
      bse: {
        "Last Traded Price": bse5Data.Header.LTP,
        "Last Traded Date": bse5Data.Header.Ason.split("|")[0],
        "Last Traded Time": bse5Data.Header.Ason.split("|")[1],
        Change: bse5Data.CurrRate.PcChg,
        "Day's Open": bse5Data.Header.Open,
        "Previous Close": bse5Data.Header.PrevClose,
        "Day's High": bse5Data.Header.High,
        "Day's Low": bse5Data.Header.Low,
        Volume: "",
        Value: "",
        "Bid Price": "",
        "Bid Quantity": "",
        "Offer Price": "",
        "Offer Quantity": "",
        "Exchange Code": bse5Data.Cmpname.EquityScrips,
        Exchange: "",
        HIGH: bse3Data.Fifty2WkHigh_adj,
        "HIGH DATE": bse3Data.Fifty2WkHigh_adjDt,
        LOW: bse3Data.Fifty2WkLow_adj,
        "LOW DATE": bse3Data.Fifty2WkLow_adjDt,
      },
    };

    // res.send({
    //   nse: nseData,
    //   bse1: bse1Data,
    //   bse2: bse2Data,
    //   bse3: bse3Data,
    //   bse4: bse4Data,
    //   bse5: bse5Data,
    //   bse6: bse6Data,
    // });
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send("Error")
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});
