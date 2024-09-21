import "../styles/App.css";
import { ethers } from "ethers";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import ethLogo from "../assets/ethlogo.svg";
import { networks } from "../utils/networks";
import React, { useEffect, useState } from "react";
import polygonLogo from "../assets/polygonlogo.svg";
import { faCopy, faSquare } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import SetOffABI from "../utils/setoff.json"; // Import your contract ABI

const CONTRACT_ADDRESS = "0x21FF55197A6Fd55678Fb76e444440189E61de557";

const Members = () => {
  const [borrowedLoans, setBorrowedLoans] = useState([]); // Store loans user has borrowed
  const [lendedLoans, setLendedLoans] = useState([]); // Store loans user has lended
  const [potentialSettlements, setPotentialSettlements] = useState([]); // Placeholder for settlements
  const [network, setNetwork] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const navigate = useNavigate();

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
      console.log("Error connecting wallet:", error);
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
            console.log("Error adding network:", error);
          }
        } else {
          console.log("Error switching network:", error);
        }
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    }

    try {
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
      console.log("Network:", networkName);
      setNetwork(networkName);

      ethereum.on("chainChanged", handleChainChanged);
    } catch (error) {
      console.log("Error checking wallet connection:", error);
    }

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const fetchLoans = async () => {
    if (!currentAccount) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const setOffContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      SetOffABI.abi,
      signer
    );

    try {
      // Fetch all loans from the contract
      const allLoans = await setOffContract.getAllLoans();
      
      // Log the fetched loans for debugging
      console.log("All Loans:", allLoans);

      // Convert the allLoans data if necessary
      const formattedLoans = allLoans.map(loan => ({
        borrower: loan.borrower.toLowerCase(),
        lender: loan.lender.toLowerCase(),
        amount: loan.amount,
        interestRate: loan.interestRate,
        term: loan.term
      }));
      
      // Filter loans based on the current account
      const borrowed = formattedLoans.filter(
        (loan) => loan.borrower === currentAccount.toLowerCase()
      );
      const lended = formattedLoans.filter(
        (loan) => loan.lender === currentAccount.toLowerCase() 
      );

      console.log("Borrowed Loans:", borrowed);
      console.log("Lended Loans:", lended);

      // Set state for borrowed and lended loans
      setBorrowedLoans(borrowed);
      setLendedLoans(lended);

      // Set potential settlements (add your logic here if needed)
      const settlements = []; // Placeholder for settlement logic
      setPotentialSettlements(settlements);
    } catch (error) {
      console.log("Error fetching loans:", error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      fetchLoans();
    }
  }, [currentAccount]);

  return (
    <div className="text-center bg-darkGray w-full">
      <header className="flex w-full bg-lightGray justify-between p-[0.75rem] z-50">
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

      <div className="flex flex-col items-center mt-20">
        <h2 className="text-6xl text-white font-bold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-10">
          {/* Borrowed Loans */}
          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">Borrowed Loans</h3>
            {borrowedLoans.length > 0 ? (
              borrowedLoans.map((loan, index) => (
                <div key={index} className="bg-beige p-4 rounded-lg mb-4">
                  <p>Loan ID: {index}</p>
                  <p>Lender: {loan.lender}</p>
                  <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
                  <p>Interest Rate: {loan.interestRate.toString()}%</p>
                  <p>Term: {loan.term.toString()} months</p>
                </div>
              ))
            ) : (
              <p>No borrowed loans</p>
            )}
          </div>

          {/* Lended Loans */}
          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">Lended Loans</h3>
            {lendedLoans.length > 0 ? (
              lendedLoans.map((loan, index) => (
                <div key={index} className="bg-beige p-4 rounded-lg mb-4">
                  <p>Loan ID: {index}</p>
                  <p>Borrower: {loan.borrower}</p>
                  <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
                  <p>Interest Rate: {loan.interestRate.toString()}%</p>
                  <p>Term: {loan.term.toString()} months</p>
                </div>
              ))
            ) : (
              <p>No lended loans</p>
            )}
          </div>

          {/* Potential Settlements */}
          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">Potential Settlements</h3>
            {potentialSettlements.length > 0 ? (
              potentialSettlements.map((settlement, index) => (
                <div key={index} className="bg-beige p-4 rounded-lg mb-4">
                  <p>Settlement ID: {index}</p>
                  <p>Details: {settlement.details}</p>
                </div>
              ))
            ) : (
              <p>No potential settlements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
