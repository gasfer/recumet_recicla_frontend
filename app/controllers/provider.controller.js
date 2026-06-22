const { response, request } = require('express');
const { Provider, Sector, sequelize, TypesProvider,DetailsInput, ViewProviderTotals } = require('../database/config');
const paginate = require('../helpers/paginate');
const { Op } = require('sequelize');
const providerService = require('../services/provider.service');

const getProviderPaginate = async (req = request, res = response) => {
    try {
        let {query, page, limit, type, status, orderNew , id_type_provider} = req.query;
        let isSearchPos = type === 'pos' ? true : false;   
        let optionsDb = {
            order: [orderNew],
            where: { 
                [Op.and]: [
                    { status },
                    id_type_provider ? {id_type_provider}: {}
                ]
            },
            include: [ { association: 'category'},{ association: 'sector'}, { association: 'type'}]
        };
        if(isSearchPos) type = null;
        if(isSearchPos) optionsDb.where[Op.or] = [
            { full_names: { [Op.iLike]: `%${query}%`}},
            { number_document: { [Op.iLike]: `%${query}%`}},
            { name_contact: { [Op.iLike]: `%${query}%`}},
        ];
        let providers = await paginate(ViewProviderTotals, page, limit, type, query, optionsDb); 
        return res.status(200).json({
            ok: true,
            providers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const getProviderByProductPaginate = async (req = request, res = response) => {
    try {
        let {query, page, limit, type, orderNew,id_sucursal, id_product} = req.query;
        let optionsDb = {
            order: [orderNew],
            where: {id_product},
            attributes: {exclude:['status','createdAt','updatedAt']},
        };
        let providers = await paginate(ViewProviderTotals, page, limit, type, query, optionsDb); 
        return res.status(200).json({
            ok: true,
            providers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const newProvider = async (req = request, res = response ) => {
    const t = await sequelize.transaction();
    try {
        const body = req.body;
        const provider = await Provider.create(body,{ transaction: t });
        await t.commit();
        return res.status(201).json({
            ok: true,
            msg: 'Proveedor registrado exitosamente',
            provider
        });
    } catch (error) {
        await t.rollback();
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const updateProvider = async (req = request, res = response) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    try {
        const body = req.body;
        const provider = await Provider.findByPk(id,{ transaction: t });
        await provider.update(body,{ transaction: t });
        await t.commit();
        return res.status(200).json({
            ok: true,
            msg: 'Proveedor actualizado exitosamente',
            provider
        });
    } catch (error) {
        await t.rollback();
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const activeInactiveProvider = async (req = request, res = response) => {
    const { id } = req.params;
    try {
        const provider = await Provider.findByPk(id);
        await provider.update({status: !provider.status});
        return res.status(200).json({
            ok: true,
            msg: `Proveedor ${provider.status ? 'activado' : 'desactivado'} exitosamente`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const getAllSectorProvider = async (req = request, res = response) => {
    try {
        let sectors =  await Sector.findAll();
        return res.status(200).json({
            ok: true,
            sectors
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const newSectorProvider = async (req = request, res = response ) => {
    try {
        const body = req.body;
        const sector = await Sector.create(body);
        return res.status(201).json({
            ok: true,
            msg: 'Sector registrado exitosamente',
            sector
        });   
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const deleteSectorProvider = async (req = request, res = response ) => {
    const { id } = req.params;
    try {
        const sector = await Sector.findByPk(id);
        await sector.destroy();
        return res.status(201).json({
            ok: true,
            msg: 'Sector eliminado exitosamente'
        });   
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          ok: false,
          errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const getAllTypesProvider = async (req = request, res = response) => {
    try {
        let typesProvider =  await TypesProvider.findAll({where:{status: true}});
        return res.status(200).json({
            ok: true,
            typesProvider
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte`}],
        });
    }
}

const getProviderAutocomplete = async (req = request, res = response) => {
    try {
        const { query = '' } = req.query;
        const providers = await providerService.findAutocompleteProviders(query);
        return res.status(200).json({
            ok: true,
            providers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            errors: [{ msg: `Ocurrió un imprevisto interno | hable con soporte` }],
        });
    }
}

module.exports = {
    getProviderPaginate,
    newProvider,
    updateProvider,
    activeInactiveProvider,
    getAllSectorProvider,
    newSectorProvider,
    deleteSectorProvider,
    getProviderByProductPaginate,
    getAllTypesProvider,
    getProviderAutocomplete
};
