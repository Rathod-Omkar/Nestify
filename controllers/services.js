const Service = require("../models/service.js");
const {buildUploadedFile} = require("../utils/uploads.js");

async function index(req, res) {
    const {category} = req.query;
    const query = {};

    if (category) {
        // Handle exact case match or mapping
        query.category = category;
    }

    const services = await Service.find(query)
        .populate({path: "owner", select: "username email"})
        .sort({createdAt: -1});

    res.render("services/index.ejs", {
        services,
        selectedCategory: category || "",
        categories: ["tour guide", "Driver", "House Help"],
    });
}

function newForm(req, res) {
    res.render("services/new.ejs", {error: null});
}

async function create(req, res) {
    try {
        const {name, category, phone, location, city, country} = req.body.service;

        // Server-side check: Phone number must be exactly 10 digits
        if (!phone || !/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, ""))) {
            return res.status(400).render("services/new.ejs", {error: "Phone number must be exactly 10 digits."});
        }

        const service = new Service({
            name,
            category,
            phone: phone.replace(/[\s-]/g, ""),
            location,
            city,
            country,
            owner: req.user._id,
        });

        if (req.file) {
            service.photo = buildUploadedFile(req.file);
        }

        await service.save();
        req.flash("success", "Service listed successfully!");
        res.redirect("/services");
    } catch (err) {
        let error = "Could not register service. Please check details.";
        if (err.code === 11000) {
            error = "A service with this phone number is already listed!";
        }
        res.status(400).render("services/new.ejs", {error});
    }
}

async function destroy(req, res) {
    const {id} = req.params;
    const service = await Service.findById(id);

    if (!service) {
        req.flash("error", "Service not found.");
        return res.redirect("/services");
    }

    const isOwner = req.user && service.owner.equals(req.user._id);
    const isAdmin = !!res.locals.currAdmin;

    if (!isOwner && !isAdmin) {
        req.flash("error", "You do not have permission to delete this service.");
        return res.redirect("/services");
    }

    await Service.findByIdAndDelete(id);
    req.flash("success", "Service deleted successfully.");
    res.redirect("/services");
}

async function editForm(req, res) {
    const {id} = req.params;
    const service = await Service.findById(id);

    if (!service) {
        req.flash("error", "Service not found.");
        return res.redirect("/services");
    }

    const isOwner = req.user && service.owner.equals(req.user._id);
    const isAdmin = !!res.locals.currAdmin;

    if (!isOwner && !isAdmin) {
        req.flash("error", "You do not have permission to edit this service.");
        return res.redirect("/services");
    }

    res.render("services/edit.ejs", {service, error: null});
}

async function update(req, res) {
    const {id} = req.params;
    const service = await Service.findById(id);

    if (!service) {
        req.flash("error", "Service not found.");
        return res.redirect("/services");
    }

    const isOwner = req.user && service.owner.equals(req.user._id);
    const isAdmin = !!res.locals.currAdmin;

    if (!isOwner && !isAdmin) {
        req.flash("error", "You do not have permission to edit this service.");
        return res.redirect("/services");
    }

    try {
        const {name, category, phone, location, city, country} = req.body.service;

        // Server-side check: Phone number must be exactly 10 digits
        if (!phone || !/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, ""))) {
            return res.status(400).render("services/edit.ejs", {
                service: { ...req.body.service, _id: id, photo: service.photo },
                error: "Phone number must be exactly 10 digits."
            });
        }

        service.name = name;
        service.category = category;
        service.phone = phone.replace(/[\s-]/g, "");
        service.location = location;
        service.city = city;
        service.country = country;

        if (req.file) {
            service.photo = buildUploadedFile(req.file);
        }

        await service.save();
        req.flash("success", "Service updated successfully!");
        res.redirect("/services");
    } catch (err) {
        let error = "Could not update service. Please check details.";
        if (err.code === 11000) {
            error = "A service with this phone number is already listed!";
        }
        res.status(400).render("services/edit.ejs", {
            service: { ...req.body.service, _id: id, photo: service.photo },
            error
        });
    }
}

module.exports = {
    index,
    newForm,
    create,
    destroy,
    editForm,
    update,
};
