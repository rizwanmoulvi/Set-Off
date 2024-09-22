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

const CONTRACT_ADDRESS = "0xCA9A920b21369729bB9e643AFbe1BdC8b3D250C2";

const Members = () => {
  const [allLoans, setAllLoans] = useState([]); // Store all loans
  const [borrowedLoans, setBorrowedLoans] = useState([]); // Store loans user has borrowed
  const [lendedLoans, setLendedLoans] = useState([]); // Store loans user has lended
  const [potentialSettlements, setPotentialSettlements] = useState([]); // Placeholder for settlements
  const [network, setNetwork] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [loanDetails, setLoanDetails] = useState({
    amount: "",
    interestRate: "",
    term: "",
  });

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

  const handleContribute = async (e) => {
    e.preventDefault();

    if (!contributeAmount) {
      alert("Please enter an amount to contribute.");
      return;
    }

    try {
      // Initialize provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Create a contract instance
      const setOffContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SetOffABI.abi,
        signer
      );

      // Estimate gas for contribution
      const gasEstimate = await setOffContract.estimateGas.contributeToPool({
        value: ethers.utils.parseEther(contributeAmount),
      });
      console.log(
        "Estimated gas limit for contribution:",
        gasEstimate.toString()
      );

      // Send contribution transaction
      const tx = await setOffContract.contributeToPool({
        value: ethers.utils.parseEther(contributeAmount),
        gasLimit: gasEstimate,
      });

      // Wait for transaction confirmation
      console.log("Contribution transaction hash:", tx.hash);
      await tx.wait();

      // Success message
      alert("Contribution successful!");
      setContributeAmount("");
    } catch (error) {
      console.log("Error during contribution:", error);
      alert("Failed to contribute. Please check the console for more details.");
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
      console.log("All Loans:", allLoans);

      // Convert the allLoans data if necessary
      const formattedLoans = allLoans.map((loan) => ({
        borrower: loan.borrower.toLowerCase(),
        lender: loan.lender.toLowerCase(),
        amount: loan.amount,
        interestRate: loan.interestRate,
        term: loan.term,
        listed: loan.listed,
      }));

      // Filter loans based on the current account
      const borrowed = formattedLoans.filter(
        (loan) => loan.borrower === currentAccount.toLowerCase() 
      );
      const lended = formattedLoans.filter(
        (loan) => loan.lender === currentAccount.toLowerCase() && loan.listed === true
      );

      console.log("Borrowed Loans:", borrowed);
      console.log("Lended Loans:", lended);

      // Set state for borrowed and lended loans
      setAllLoans(formattedLoans);
      setBorrowedLoans(borrowed);
      setLendedLoans(lended);

      // Fetch potential settlements
      const [creditors, debtors, amounts] =
        await setOffContract.findPotentialSettlements();

      const settlements = creditors.map((creditor, index) => ({
        creditor,
        debtor: debtors[index],
        amount: amounts[index],
      }));

      console.log("Potential Settlements:", settlements);
      setPotentialSettlements(settlements);
    } catch (error) {
      console.log("Error fetching loans or settlements:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoanDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const fetchPotentialSettlements = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const setOffContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      SetOffABI.abi,
      signer
    );

    try {
      const [creditors, debtors, amounts] =
        await setOffContract.findPotentialSettlements();

      const settlements = creditors.map((creditor, index) => ({
        creditor,
        debtor: debtors[index],
        amount: ethers.utils.formatEther(amounts[index]),
      }));

      setPotentialSettlements(settlements);
    } catch (error) {
      console.log("Error fetching potential settlements:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { amount, interestRate, term } = loanDetails;

    // Step 1: Check if fields are filled
    if (!amount || !interestRate || !term) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Step 2: Initialize ethers.js provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Step 3: Check if the wallet is connected and has enough balance
      const walletAddress = await signer.getAddress();
      const walletBalance = await provider.getBalance(walletAddress);
      console.log("Wallet address:", walletAddress);
      console.log(
        "Wallet balance (ETH):",
        ethers.utils.formatEther(walletBalance)
      );

      if (ethers.utils.parseEther(amount).gt(walletBalance)) {
        alert(
          "Insufficient funds in your wallet to cover the loan amount and gas fees."
        );
        return;
      }

      // Step 4: Create a contract instance
      const setOffContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SetOffABI.abi,
        signer
      );

      // Step 5: Estimate gas limit to ensure enough gas is provided
      const gasEstimate = await setOffContract.estimateGas.createLoan(
        ethers.utils.parseEther(amount),
        interestRate,
        term
      );
      console.log("Estimated gas limit:", gasEstimate.toString());

      // Step 6: Execute the transaction
      const tx = await setOffContract.createLoan(
        ethers.utils.parseEther(amount),
        interestRate,
        term,
        { gasLimit: gasEstimate }
      );

      // Step 7: Wait for transaction confirmation
      console.log("Transaction hash:", tx.hash);
      await tx.wait();

      // Step 8: Confirm success and reset form
      alert("Loan listed successfully");
      setShowPopup(false);
      setLoanDetails({
        amount: "",
        interestRate: "",
        term: "",
      });
    } catch (error) {
      // Step 9: Debug potential issues
      if (error.code === ethers.errors.INSUFFICIENT_FUNDS) {
        alert("Insufficient funds to complete the transaction.");
      } else if (error.code === ethers.errors.NETWORK_ERROR) {
        alert(
          "Network error: Please check your connection or try switching networks."
        );
      } else {
        console.log("Error listing loan:", error);
        alert("Failed to list loan. Check console for details.");
      }
    }
  };

  const repayLoan = async (loanId, amount) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const setOffContract = new ethers.Contract(CONTRACT_ADDRESS, SetOffABI.abi, signer);
  
    try {
      // Convert amount to BigNumber format
      const repaymentAmount = ethers.utils.parseEther(amount);
      
      // Estimate gas limit
      const estimatedGas = await setOffContract.estimateGas.repayLoan(loanId, {
        value: repaymentAmount
      });
  
      // Define a gas limit with a buffer
      const gasLimit = estimatedGas.add(ethers.utils.parseUnits("100000", "gwei"));
  
      // Call the smart contract function to repay the loan
      const tx = await setOffContract.repayLoan(loanId, {
        value: repaymentAmount,
        gasLimit: gasLimit // Set the gas limit manually
      });
      
      await tx.wait();
      alert("Loan repaid successfully");
  
      // Optionally refresh or update state
      // e.g., fetchBorrowedLoans();
    } catch (error) {
      console.log("Error repaying loan:", error);
      alert("Failed to repay loan. Check console for details.");
    }
  };
  

  const handleSettle = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet.');
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const setOffContract = new ethers.Contract(CONTRACT_ADDRESS, SetOffABI.abi, signer);

    try {
      const tx = await setOffContract.settle();
      await tx.wait();
      alert('Settled successfully');
    } catch (error) {
      console.error('Error settling:', error);
      alert('Failed to settle. Check console for details.');
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
    <div className="text-center bg-darkGray w-full mb-5">
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

        <div className="contribute-section">
          <h2 className="text-2xl font-bold text-peach">
            Contribute to Loan Pool And List A Loan
          </h2>
          <form
            onSubmit={handleContribute}
            className="flex flex-col gap-4 mt-4"
          >
            <input
              type="number"
              name="contributeAmount"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="Contribution Amount (ETH)"
              className="p-2 border border-gray-300 rounded"
            />
            <button
              type="submit"
              className="bg-beige text-textGreen mb-5 font-bold rounded-lg px-8 py-3 mt-4"
            >
              Contribute
            </button>
          </form>
        </div>

        <button
          onClick={() => setShowPopup(true)}
          className="bg-beige text-textGreen mb-2 font-bold rounded-lg px-8 py-3"
        >
          List Loan
        </button>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2 className="text-2xl font-bold text-peach">List a New Loan</h2>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mt-4"
              >
                <input
                  type="number"
                  name="amount"
                  value={loanDetails.amount}
                  onChange={handleInputChange}
                  placeholder="Loan Amount (ETH)"
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  name="interestRate"
                  value={loanDetails.interestRate}
                  onChange={handleInputChange}
                  placeholder="Interest Rate (%)"
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  name="term"
                  value={loanDetails.term}
                  onChange={handleInputChange}
                  placeholder="Term (months)"
                  className="p-2 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  className="bg-beige text-textGreen font-bold rounded-lg px-8 py-3 mt-4"
                >
                  List Loan
                </button>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="bg-red-500 text-white font-bold rounded-lg px-8 py-3 mt-2"
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 mt-10 gap-8 w-full px-10">
          {/* Borrowed Loans */}
          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">
              Borrowed Loans
            </h3>
            {borrowedLoans.length > 0 ? (
  borrowedLoans.map((loan, index) => {
    const loanId = allLoans.findIndex(
      (allLoan) =>
        allLoan.lender === loan.lender &&
        allLoan.borrower === loan.borrower &&
        allLoan.amount === loan.amount &&
        allLoan.interestRate === loan.interestRate &&
        allLoan.term === loan.term
    ); // Find loan ID based on allLoans array

    return (
      <div key={index} className="bg-white p-4 rounded-lg mb-4">
        <p>Loan ID: {loanId !== -1 ? loanId : "Not found"}</p>
        <p>Lender: {loan.lender}</p>
        <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
        <p>Interest Rate: {loan.interestRate.toString()}%</p>
        <p>Term: {loan.term.toString()} months</p>
        <button
          onClick={() => repayLoan(loanId, ethers.utils.formatEther(loan.amount))}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Repay Loan
        </button>
      </div>
    );
  })
) : (
  <p>No borrowed loans</p>
)}
          </div>

          {/* Lended Loans */}
          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">
              Listed & Lended Loans
            </h3>
            {lendedLoans.length > 0 ? (
              lendedLoans.map((loan, index) => {
                const loanId = allLoans.findIndex(
                  (l) =>
                    l.borrower === loan.borrower &&
                    l.amount === loan.amount &&
                    l.interestRate === loan.interestRate &&
                    l.term === loan.term
                ); // Find loan ID based on allLoans array
                return (
                  <div key={index} className="bg-white  p-4 rounded-lg mb-4">
                    <p>Loan ID: {loanId !== -1 ? loanId : "Not found"}</p>
                    <p>Borrower: {loan.borrower}</p>
                    <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
                    <p>Interest Rate: {loan.interestRate.toString()}%</p>
                    <p>Term: {loan.term.toString()} months</p>
                    <p>Listed: {loan.listed.toString()}</p>
                  </div>
                );
              })
            ) : (
              <p>No lended loans</p>
            )}
          </div>

          {/* //--------------- */}

          <div className="bg-beige p-4 rounded-lg">
            <h3 className="text-xl text-textGreen font-bold mb-4">
              Potential Settlements
            </h3>
            <button
              onClick={fetchPotentialSettlements}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Find
            </button>
            
            <button
        onClick={handleSettle}
        className="mt-4 bg-green-500 text-white px-4 ml-5 py-2 rounded-lg"
      >
        Settle
      </button>
            {potentialSettlements.length > 0 ? (
              potentialSettlements.map((settlement, index) => (
                <div key={index} className="bg-beige p-4 rounded-lg mb-4">
                  <p>Settlement ID: {index}</p>
                  <p>Creditor: {settlement.creditor.toString()}</p>
                  <p>Debtor: {settlement.debtor.toString()}</p>
                  <p>Amount: {(settlement.amount ).toString()} ETH</p>
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
