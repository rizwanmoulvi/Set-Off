// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SetOff {

    struct Loan {
        address borrower;
        address lender;
        uint amount;
        uint interest;
        uint startTime;
        bool repaid;
        uint partialPaid;  // Track partial payments
    }

    address public owner;
    uint public poolBalance;

    mapping(address => uint) public lenderBalances;  // Track lenders' contributions
    mapping(address => int) public netBalances;  // Net balance tracking for each participant
    Loan[] public loans;  // Array of all loans to track individual loans

    event LoanTaken(address indexed borrower, address indexed lender, uint amount, uint interest);
    event LoanRepaid(address indexed borrower, address indexed lender, uint amount);
    event NetSettled(address indexed from, address indexed to, uint amount);
    event PartialPaymentMade(address indexed borrower, uint amountPaid);

    constructor() {
        owner = msg.sender;
    }

    // Lender contributes to the pool
    function contributeToPool() external payable {
        require(msg.value > 0, "Contribution must be greater than zero");
        lenderBalances[msg.sender] += msg.value;
        poolBalance += msg.value;
    }

    // Borrower takes a loan from the pool
    function borrow(address _lender, uint _amount, uint _interest) external {
        require(_amount <= lenderBalances[_lender], "Lender doesn't have enough funds");
        
        loans.push(Loan({
            borrower: msg.sender,
            lender: _lender,
            amount: _amount,
            interest: _interest,
            startTime: block.timestamp,
            repaid: false,
            partialPaid: 0  // Initialize the partialPaid to 0 when loan is created
        }));

        lenderBalances[_lender] -= _amount;
        netBalances[_lender] -= int(_amount);  // Deduct from lender's balance
        netBalances[msg.sender] += int(_amount);  // Add to borrower's debt

        poolBalance -= _amount;
        payable(msg.sender).transfer(_amount);

        emit LoanTaken(msg.sender, _lender, _amount, _interest);
    }

    // Borrower repays a loan
    function repayLoan(uint _loanIndex) external payable {
        require(_loanIndex < loans.length, "Invalid loan index");
        Loan storage loan = loans[_loanIndex];
        require(loan.borrower == msg.sender, "Not your loan to repay");
        require(!loan.repaid, "Loan already repaid");
        
        uint repaymentAmount = loan.amount + loan.amount * loan.interest / 100;
        require(msg.value >= repaymentAmount, "Not enough funds to repay loan");

        loan.repaid = true;

        lenderBalances[loan.lender] += repaymentAmount;
        netBalances[loan.borrower] -= int(repaymentAmount);
        netBalances[loan.lender] += int(repaymentAmount);

        poolBalance += repaymentAmount;

        emit LoanRepaid(loan.borrower, loan.lender, repaymentAmount);
    }

    // Netting: Calculate who owes what and settle debts
    function netAndSettle() external {
        require(msg.sender == owner, "Only owner can trigger settlement");

        for (uint i = 0; i < loans.length; i++) {
            Loan storage loan = loans[i];
            if (!loan.repaid) {
                uint repaymentAmount = loan.amount + loan.amount * loan.interest / 100;
                uint remainingAmount = repaymentAmount - loan.partialPaid;  // Calculate the remaining amount after partial payments

                if (netBalances[loan.borrower] >= 0 && netBalances[loan.lender] <= int(remainingAmount)) {
                    loan.repaid = true;
                    
                    loan.partialPaid = repaymentAmount;  // Full repayment

                    netBalances[loan.lender] += int(remainingAmount);
                    netBalances[loan.borrower] -= int(remainingAmount);

                    payable(loan.lender).transfer(remainingAmount);
                    emit NetSettled(loan.borrower, loan.lender, remainingAmount);
                } else if (netBalances[loan.borrower] > 0) {
                    // If only a partial amount can be settled, update the partialPaid amount
                    uint partialAmount = uint(netBalances[loan.borrower]);

                    loan.partialPaid += partialAmount;  // Update partial repayment
                    netBalances[loan.borrower] = 0;
                    netBalances[loan.lender] += int(partialAmount);

                    payable(loan.lender).transfer(partialAmount);

                    emit PartialPaymentMade(loan.borrower, partialAmount);
                }
            }
        }
    }

    // Utility to view net balance of a participant
    function getNetBalance(address _participant) external view returns (int) {
        return netBalances[_participant];
    }

    // Withdraw excess funds by the owner
    function withdrawFunds(uint _amount) external {
        require(msg.sender == owner, "Only owner can withdraw funds");
        require(_amount <= poolBalance, "Not enough funds in the pool");
        poolBalance -= _amount;
        payable(owner).transfer(_amount);
    }
}
