// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title WomenSupplyChain
 * @author Blockchain Assignment — Women Empowerment in Semi-Urban Rwanda
 * @notice This contract enables women-led businesses in semi-urban Rwanda to
 *         register products, track supply chain stages, and prove product
 *         authenticity to buyers — without needing a bank or intermediary.
 * @dev Deployed on Ethereum Sepolia Testnet
 */
contract WomenSupplyChain {

    // -----------------------------------------------------------------------
    // DATA STRUCTURES
    // -----------------------------------------------------------------------

    /// @notice Represents a woman-led business registered on the platform
    struct Business {
        address owner;        // Wallet address of the business owner
        string name;          // Business name (e.g. "Amahoro Baskets Co.")
        string location;      // Semi-urban district (e.g. "Musanze")
        bool isRegistered;    // Whether the business is active
        uint256 registeredAt; // Timestamp of registration
    }

    /// @notice Represents a product in the supply chain
    struct Product {
        uint256 id;               // Unique product ID
        string name;              // Product name (e.g. "Handwoven Basket")
        string category;          // Category (e.g. "Crafts", "Agriculture")
        address producer;         // Address of the woman-led business
        uint256 price;            // Price in wei
        bool isAvailable;         // Whether product is currently available
        uint256 createdAt;        // When the product was created
        uint256 stageCount;       // How many supply chain stages recorded
    }

    /// @notice Represents one stage in the product's supply chain journey
    struct SupplyStage {
        string stageName;     // e.g. "Harvested", "Processed", "Shipped"
        string location;      // Where this stage happened
        string notes;         // Any additional notes
        address recordedBy;   // Who recorded this stage
        uint256 timestamp;    // When this stage was recorded
    }

    /// @notice Represents a purchase/sale record
    struct Purchase {
        uint256 productId;    // Which product was bought
        address buyer;        // Who bought it
        address seller;       // Who sold it
        uint256 price;        // Price paid in wei
        uint256 timestamp;    // When the purchase happened
    }

    // -----------------------------------------------------------------------
    // STATE VARIABLES
    // -----------------------------------------------------------------------

    address public contractOwner;         // The deployer of this contract
    uint256 public productCounter;        // Auto-incrementing product ID
    uint256 public purchaseCounter;       // Auto-incrementing purchase ID

    mapping(address => Business) public businesses;
    mapping(uint256 => Product) public products;
    mapping(uint256 => SupplyStage[]) public supplyStages;
    mapping(uint256 => Purchase) public purchases;
    mapping(address => uint256[]) public businessProducts;

    // -----------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------

    event BusinessRegistered(address indexed owner, string name, string location);
    event ProductRegistered(uint256 indexed productId, string name, address indexed producer);
    event StageAdded(uint256 indexed productId, string stageName, string location);
    event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 price);
    event ProductAvailabilityUpdated(uint256 indexed productId, bool isAvailable);

    // -----------------------------------------------------------------------
    // MODIFIERS
    // -----------------------------------------------------------------------

    modifier onlyRegisteredBusiness() {
        require(businesses[msg.sender].isRegistered, "You must register your business first");
        _;
    }

    modifier onlyProductOwner(uint256 _productId) {
        require(products[_productId].producer == msg.sender, "Only the product owner can do this");
        _;
    }

    modifier productExists(uint256 _productId) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist");
        _;
    }

    // -----------------------------------------------------------------------
    // CONSTRUCTOR
    // -----------------------------------------------------------------------

    constructor() {
        contractOwner = msg.sender;
        productCounter = 0;
        purchaseCounter = 0;
    }

    // -----------------------------------------------------------------------
    // BUSINESS FUNCTIONS
    // -----------------------------------------------------------------------

    function registerBusiness(string memory _name, string memory _location) external {
        require(!businesses[msg.sender].isRegistered, "Business already registered");
        require(bytes(_name).length > 0, "Business name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");

        businesses[msg.sender] = Business({
            owner: msg.sender,
            name: _name,
            location: _location,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        emit BusinessRegistered(msg.sender, _name, _location);
    }

    function getBusiness(address _owner)
        external view
        returns (string memory, string memory, bool, uint256)
    {
        Business memory b = businesses[_owner];
        return (b.name, b.location, b.isRegistered, b.registeredAt);
    }

    // -----------------------------------------------------------------------
    // PRODUCT FUNCTIONS
    // -----------------------------------------------------------------------

    function registerProduct(
        string memory _name,
        string memory _category,
        uint256 _price
    ) external onlyRegisteredBusiness {
        require(bytes(_name).length > 0, "Product name cannot be empty");
        require(_price > 0, "Price must be greater than zero");

        productCounter++;

        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            category: _category,
            producer: msg.sender,
            price: _price,
            isAvailable: true,
            createdAt: block.timestamp,
            stageCount: 0
        });

        businessProducts[msg.sender].push(productCounter);
        emit ProductRegistered(productCounter, _name, msg.sender);
    }

    function getProduct(uint256 _productId)
        external view productExists(_productId)
        returns (uint256, string memory, string memory, address, uint256, bool, uint256, uint256)
    {
        Product memory p = products[_productId];
        return (p.id, p.name, p.category, p.producer, p.price, p.isAvailable, p.createdAt, p.stageCount);
    }

    function getBusinessProducts(address _owner) external view returns (uint256[] memory) {
        return businessProducts[_owner];
    }

    function setProductAvailability(uint256 _productId, bool _isAvailable)
        external productExists(_productId) onlyProductOwner(_productId)
    {
        products[_productId].isAvailable = _isAvailable;
        emit ProductAvailabilityUpdated(_productId, _isAvailable);
    }

    // -----------------------------------------------------------------------
    // SUPPLY CHAIN TRACKING
    // -----------------------------------------------------------------------

    function addSupplyStage(
        uint256 _productId,
        string memory _stageName,
        string memory _location,
        string memory _notes
    ) external productExists(_productId) onlyProductOwner(_productId) {
        require(bytes(_stageName).length > 0, "Stage name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");

        supplyStages[_productId].push(SupplyStage({
            stageName: _stageName,
            location: _location,
            notes: _notes,
            recordedBy: msg.sender,
            timestamp: block.timestamp
        }));

        products[_productId].stageCount++;
        emit StageAdded(_productId, _stageName, _location);
    }

    function getSupplyStage(uint256 _productId, uint256 _stageIndex)
        external view productExists(_productId)
        returns (string memory, string memory, string memory, address, uint256)
    {
        require(_stageIndex < supplyStages[_productId].length, "Stage does not exist");
        SupplyStage memory s = supplyStages[_productId][_stageIndex];
        return (s.stageName, s.location, s.notes, s.recordedBy, s.timestamp);
    }

    function getStageCount(uint256 _productId)
        external view productExists(_productId)
        returns (uint256)
    {
        return supplyStages[_productId].length;
    }

    // -----------------------------------------------------------------------
    // PURCHASE FUNCTIONS
    // -----------------------------------------------------------------------

    function purchaseProduct(uint256 _productId)
        external payable productExists(_productId)
    {
        Product storage p = products[_productId];
        require(p.isAvailable, "Product is not available for sale");
        require(msg.sender != p.producer, "Producer cannot buy their own product");
        require(msg.value >= p.price, "Insufficient payment");

        p.isAvailable = false;

        purchaseCounter++;
        purchases[purchaseCounter] = Purchase({
            productId: _productId,
            buyer: msg.sender,
            seller: p.producer,
            price: msg.value,
            timestamp: block.timestamp
        });

        (bool sent, ) = payable(p.producer).call{value: msg.value}("");
        require(sent, "Payment transfer failed");

        emit ProductPurchased(_productId, msg.sender, p.producer, msg.value);
    }

    function getPurchase(uint256 _purchaseId)
        external view
        returns (uint256, address, address, uint256, uint256)
    {
        Purchase memory pur = purchases[_purchaseId];
        return (pur.productId, pur.buyer, pur.seller, pur.price, pur.timestamp);
    }

    function getTotalProducts() external view returns (uint256) {
        return productCounter;
    }

    function getTotalPurchases() external view returns (uint256) {
        return purchaseCounter;
    }
}