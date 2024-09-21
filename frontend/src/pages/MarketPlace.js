import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import polygonLogo from "../assets/polygonlogo.svg";
import ethLogo from "../assets/ethlogo.svg";
import { networks } from "../utils/networks";
import { ethers } from "ethers";
import SetOffABI from "../utils/setoff.json";
import { Link } from "react-router-dom";

const CONTRACT_ADDRESS = "0x21FF55197A6Fd55678Fb76e444440189E61de557";

const MarketPlace = () => {
  const [network, setNetwork] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [loans, setLoans] = useState([]); // Store loans here

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    const networkName = networks[chainId] || "Unknown Network";
    console.log(networkName);
    setNetwork(networkName);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const fetchListedLoans = async () => {
    try {
      if (!currentAccount) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const setOffContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SetOffABI.abi,
        signer
      );

      console.log("Fetching listed loans...");
      const loans = await setOffContract.getListedLoans();
      console.log("Listed loans:", loans);
      setLoans(loans); // Store the loans in state
    } catch (error) {
      console.log("Error fetching listed loans:", error);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xe705" }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xe705",
                  chainName: "Linea Sepolia Testnet",
                  rpcUrls: ["https://linea-sepolia.infura.io/v3/"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.lineascan.build/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const borrowLoan = async (loanId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const setOffContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SetOffABI.abi,
        signer
      );

      const transaction = await setOffContract.borrow(loanId);
      await transaction.wait();
      console.log(`Successfully borrowed loan with ID: ${loanId}`);
      // Optionally, you can refresh the list of loans after borrowing
      fetchListedLoans();
    } catch (error) {
      console.error("Failed to borrow loan:", error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchListedLoans(); // Fetch loans when the component loads
  }, [currentAccount]);

  return (
    <div className="text-center bg-darkGray w-full">
      <header className="flex w-full bg-lightGray fixed justify-between p-[0.75rem] z-50">
        <div className="flex items-center text-left ml-10">
          <Link to="/">
            <p className="text-4xl font-bold text-peach cursor-pointer">
              Set Off
            </p>
          </Link>
        </div>
        <div className="flex rounded-lg px-5 py-3 mr-10 mt-2 gap-4">
          <Link
            to="/marketplace"
            className="h-12 bg-beige text-textGreen font-bold rounded-lg px-8 py-3 animate-gradient-animation"
          >
            <p>Marketplace</p>
          </Link>
          <Link
            to={`/dashboard/${currentAccount}`}
            className="h-12 bg-beige text-textGreen font-bold rounded-lg px-8 py-3 animate-gradient-animation"
          >
            <p>Dashboard</p>
          </Link>
          <div className="flex flex-col items-center mx-auto max-w-lg">
            <button
              onClick={connectWallet}
              className="bg-beige text-textGreen font-bold flex px-8 py-3 rounded-lg"
            >
              {currentAccount ? "Connected" : "Connect Wallet"}
            </button>
          </div>
          <div className="bg-beige text-textGreen font-bold flex px-8 py-3 rounded-lg">
            {network === "Linea Sepolia Testnet" ? (
              <div className="flex">
                <img
                  alt="Network logo"
                  className="w-5 h-5 mr-2"
                  src={network.includes("Polygon") ? polygonLogo : ethLogo}
                />

                <p>
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}
                </p>
              </div>
            ) : (
              <button
                onClick={switchNetwork}
                className="cta-button mint-button"
              >
                Switch to Linea Sepolia
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 ">
        <h2 className="text-6xl text-beige font-bold text-peach mt-32 mb-4">
          Listed Loans
        </h2>
        {loans.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loans.map((loan, index) => (
              <div
                key={index}
                className="bg-beige p-4 rounded-lg text-textGreen shadow-md"
              >
                <p>Loan ID: {index}</p>
                <p>Lender: {loan.lender}</p>
                <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
                <p>Interest Rate: {loan.interestRate.toString()}%</p>
                <p>Term: {loan.term.toString()} months</p>
                {/* Show borrow button only if the current account is not the lender */}
                {currentAccount.toUpperCase() !==
                  loan.lender.toString().toUpperCase() && (
                  <button
                    onClick={() => borrowLoan(index)}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
                  >
                    Borrow
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No loans listed</p>
        )}
      </div>
    </div>
  );
};

export default MarketPlace;
