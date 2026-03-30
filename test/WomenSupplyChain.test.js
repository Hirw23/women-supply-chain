const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WomenSupplyChain", function () {
  let contract;
  let owner, business1, business2, buyer;

  beforeEach(async function () {
    [owner, business1, business2, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("WomenSupplyChain");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ------- Business Registration -------
  describe("Business Registration", function () {

    it("TC-01: Should register a new business successfully", async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
      const [name, location, isRegistered] = await contract.getBusiness(business1.address);
      expect(name).to.equal("Amahoro Baskets");
      expect(location).to.equal("Musanze");
      expect(isRegistered).to.equal(true);
    });

    it("TC-02: Should reject duplicate business registration", async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
      await expect(
        contract.connect(business1).registerBusiness("Another Name", "Kigali")
      ).to.be.revertedWith("Business already registered");
    });

    it("TC-03: Should reject empty business name", async function () {
      await expect(
        contract.connect(business1).registerBusiness("", "Musanze")
      ).to.be.revertedWith("Business name cannot be empty");
    });

    it("TC-04: Should reject empty location", async function () {
      await expect(
        contract.connect(business1).registerBusiness("Amahoro Baskets", "")
      ).to.be.revertedWith("Location cannot be empty");
    });

    it("TC-05: Should emit BusinessRegistered event", async function () {
      await expect(
        contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze")
      ).to.emit(contract, "BusinessRegistered")
        .withArgs(business1.address, "Amahoro Baskets", "Musanze");
    });
  });

  // ------- Product Registration -------
  describe("Product Registration", function () {

    beforeEach(async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
    });

    it("TC-06: Should register a product successfully", async function () {
      await contract.connect(business1).registerProduct(
        "Handwoven Basket", "Crafts", ethers.parseEther("0.01")
      );
      const [id, name, category, producer, price, isAvailable] =
        await contract.getProduct(1);
      expect(id).to.equal(1n);
      expect(name).to.equal("Handwoven Basket");
      expect(category).to.equal("Crafts");
      expect(producer).to.equal(business1.address);
      expect(price).to.equal(ethers.parseEther("0.01"));
      expect(isAvailable).to.equal(true);
    });

    it("TC-07: Should reject product from unregistered business", async function () {
      await expect(
        contract.connect(business2).registerProduct(
          "Basket", "Crafts", ethers.parseEther("0.01")
        )
      ).to.be.revertedWith("You must register your business first");
    });

    it("TC-08: Should reject product with zero price", async function () {
      await expect(
        contract.connect(business1).registerProduct("Basket", "Crafts", 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("TC-09: Should increment product counter correctly", async function () {
      await contract.connect(business1).registerProduct(
        "Basket", "Crafts", ethers.parseEther("0.01")
      );
      await contract.connect(business1).registerProduct(
        "Mat", "Crafts", ethers.parseEther("0.005")
      );
      const total = await contract.getTotalProducts();
      expect(total).to.equal(2n);
    });

    it("TC-10: Should track products by business address", async function () {
      await contract.connect(business1).registerProduct(
        "Basket", "Crafts", ethers.parseEther("0.01")
      );
      await contract.connect(business1).registerProduct(
        "Mat", "Crafts", ethers.parseEther("0.005")
      );
      const productIds = await contract.getBusinessProducts(business1.address);
      expect(productIds.length).to.equal(2);
      expect(productIds[0]).to.equal(1n);
      expect(productIds[1]).to.equal(2n);
    });
  });

  // ------- Supply Chain Tracking -------
  describe("Supply Chain Tracking", function () {

    beforeEach(async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
      await contract.connect(business1).registerProduct(
        "Handwoven Basket", "Crafts", ethers.parseEther("0.01")
      );
    });

    it("TC-11: Should add a supply stage successfully", async function () {
      await contract.connect(business1).addSupplyStage(
        1, "Harvested", "Musanze Farm", "Raw materials collected"
      );
      const [stageName, location, notes] = await contract.getSupplyStage(1, 0);
      expect(stageName).to.equal("Harvested");
      expect(location).to.equal("Musanze Farm");
      expect(notes).to.equal("Raw materials collected");
    });

    it("TC-12: Should reject stage addition from non-owner", async function () {
      await contract.connect(business2).registerBusiness("Other Business", "Kigali");
      await expect(
        contract.connect(business2).addSupplyStage(1, "Processed", "Kigali", "Notes")
      ).to.be.revertedWith("Only the product owner can do this");
    });

    it("TC-13: Should track multiple stages in order", async function () {
      await contract.connect(business1).addSupplyStage(1, "Harvested", "Musanze", "");
      await contract.connect(business1).addSupplyStage(1, "Processed", "Musanze Workshop", "");
      await contract.connect(business1).addSupplyStage(1, "Quality Check", "Musanze", "Passed");

      const count = await contract.getStageCount(1);
      expect(count).to.equal(3n);

      const [stage0] = await contract.getSupplyStage(1, 0);
      const [stage1] = await contract.getSupplyStage(1, 1);
      const [stage2] = await contract.getSupplyStage(1, 2);
      expect(stage0).to.equal("Harvested");
      expect(stage1).to.equal("Processed");
      expect(stage2).to.equal("Quality Check");
    });

    it("TC-14: Should emit StageAdded event", async function () {
      await expect(
        contract.connect(business1).addSupplyStage(1, "Shipped", "Kigali", "")
      ).to.emit(contract, "StageAdded")
        .withArgs(1n, "Shipped", "Kigali");
    });

    it("TC-15: Should reject stage with empty stage name", async function () {
      await expect(
        contract.connect(business1).addSupplyStage(1, "", "Musanze", "")
      ).to.be.revertedWith("Stage name cannot be empty");
    });
  });

  // ------- Purchase -------
  describe("Product Purchase", function () {

    beforeEach(async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
      await contract.connect(business1).registerProduct(
        "Handwoven Basket", "Crafts", ethers.parseEther("0.01")
      );
    });

    it("TC-16: Should allow a buyer to purchase a product", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(business1.address);
      await contract.connect(buyer).purchaseProduct(1, {
        value: ethers.parseEther("0.01")
      });
      const sellerBalanceAfter = await ethers.provider.getBalance(business1.address);
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
    });

    it("TC-17: Should mark product as unavailable after purchase", async function () {
      await contract.connect(buyer).purchaseProduct(1, {
        value: ethers.parseEther("0.01")
      });
      const [,,,,, isAvailable] = await contract.getProduct(1);
      expect(isAvailable).to.equal(false);
    });

    it("TC-18: Should reject purchase with insufficient payment", async function () {
      await expect(
        contract.connect(buyer).purchaseProduct(1, {
          value: ethers.parseEther("0.001")
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("TC-19: Should reject producer buying their own product", async function () {
      await expect(
        contract.connect(business1).purchaseProduct(1, {
          value: ethers.parseEther("0.01")
        })
      ).to.be.revertedWith("Producer cannot buy their own product");
    });

    it("TC-20: Should emit ProductPurchased event", async function () {
      await expect(
        contract.connect(buyer).purchaseProduct(1, {
          value: ethers.parseEther("0.01")
        })
      ).to.emit(contract, "ProductPurchased")
        .withArgs(1n, buyer.address, business1.address, ethers.parseEther("0.01"));
    });
  });

  // ------- Availability -------
  describe("Product Availability", function () {

    beforeEach(async function () {
      await contract.connect(business1).registerBusiness("Amahoro Baskets", "Musanze");
      await contract.connect(business1).registerProduct(
        "Handwoven Basket", "Crafts", ethers.parseEther("0.01")
      );
    });

    it("TC-21: Should let owner toggle product availability", async function () {
      await contract.connect(business1).setProductAvailability(1, false);
      const [,,,,, isAvailable] = await contract.getProduct(1);
      expect(isAvailable).to.equal(false);
    });

    it("TC-22: Should reject purchase of unavailable product", async function () {
      await contract.connect(business1).setProductAvailability(1, false);
      await expect(
        contract.connect(buyer).purchaseProduct(1, {
          value: ethers.parseEther("0.01")
        })
      ).to.be.revertedWith("Product is not available for sale");
    });

    it("TC-23: Should reject availability change from non-owner", async function () {
      await expect(
        contract.connect(buyer).setProductAvailability(1, false)
      ).to.be.revertedWith("Only the product owner can do this");
    });
  });
});