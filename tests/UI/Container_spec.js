/*!
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */
describe("Container", function () {
    this.timeout(0);

    this.fixture = "Piwik\\Plugins\\TagManager\\tests\\Fixtures\\TagManagerFixture";
    this.optionsOverride = {
        'persist-fixture-data': false
    };

    var generalParamsSite1 = '?idSite=2&period=day&date=2010-01-03',
        generalParamsSite5 = '?idSite=5&period=day&date=2010-01-03',
        urlBase = '&module=TagManager&action=manageContainers';

    var permissions = require("./permissions");
    var form = require("./form");
    var capture = require("./capture");
    var modal = require("./modal");

    before(function () {
        testEnvironment.pluginsToLoad = ['TagManager'];
        testEnvironment.save();
    });

    beforeEach(function () {
        testEnvironment.testGenerateFixedId = 1;
        testEnvironment.save();
    });

    afterEach(function () {
        permissions.resetUser();
        testEnvironment.testUseMockAuth = 1;
        delete testEnvironment.testGenerateFixedId;
        testEnvironment.save();
    });

    async function createOrUpdateContainer()
    {
        await page.click('.editContainer .createButton');
        await page.waitForNetworkIdle();
        await page.waitForTimeout(150);
        await page.waitForNetworkIdle();
    }

    async function cancelContainer()
    {
        await page.click('.editContainer .entityCancel a');
    }

    it('should load a container page with containers', async function () {
        await page.goto(generalParamsSite1 + urlBase);
        await capture.setTableRowHeight(page);
        pageWrap = await page.$('#content');
        expect(await pageWrap.screenshot()).to.matchImage('site_some_exist');
    });

    it('should show websites dropdown without all websites', async function () {
        await page.evaluate(() => $('.top_bar_sites_selector .siteSelector a.title').click());
        pageWrap = await page.$('.top_bar_sites_selector .dropdown');
        expect(await pageWrap.screenshot()).to.matchImage('websites_dropdown_without_all_websites');
        await page.evaluate(() => $('.top_bar_sites_selector .siteSelector a.title').click());
    });

    it('should be able to create a new container', async function () {
        await page.click('.createNewContainer');
        await capture.setTableRowHeight(page);
        pageWrap = await page.$('#content');
        expect(await pageWrap.screenshot()).to.matchImage('create_new');
    });

    it('should show an error when not possible to create container', async function () {
        await form.sendFieldValue(page, '.editContainer #description', 'My Description');
        await page.click('.editContainer #description');
        await createOrUpdateContainer();
        await capture.page(page, 'create_new_error');
    });

    it('should be able to prefill container', async function () {
        await form.sendFieldValue(page, '.editContainer #name', 'My Container Name');
        await form.sendFieldValue(page, '.editContainer #description', 'My Description');
        await capture.page(page, 'create_new_prefilled');
    });

    it('should be able to create a new container and show dashboard afterwards', async function () {
        await createOrUpdateContainer();
        await capture.page(page, 'create_new_submitted');
    });

    it('should load an edit container page through URL', async function () {
        await page.goto(generalParamsSite1 + urlBase + '#?idContainer=aaacont2');
        await capture.page(page, 'edit_url');
    });

    it('should set isTagFireLimitAllowedInPreviewMode as active when set and save', async function(){
        await page.evaluate(() => $('#isTagFireLimitAllowedInPreviewMode').click());
        await page.waitForTimeout(250);
        await page.waitForNetworkIdle();
        await capture.page(page, 'edit_url_with_isTagFireLimitAllowedInPreviewMode');
    });

    it('should set isTagFireLimitAllowedInPreviewMode as inactive when set and save', async function(){
        await page.evaluate(() => $('#isTagFireLimitAllowedInPreviewMode').click());
        await page.waitForTimeout(250);
        await page.waitForNetworkIdle();
        await capture.page(page, 'edit_url_without_isTagFireLimitAllowedInPreviewMode');
    });

    it('should set activelySyncGtmDataLayer as active when set and save', async function(){
        await page.evaluate(() => $('#activelySyncGtmDataLayer').click());
        await page.waitForTimeout(250);
        await page.waitForNetworkIdle();
        await capture.page(page, 'edit_url_with_activelySyncGtmDataLayer');
    });

    it('should set activelySyncGtmDataLayer as inactive when set and save', async function(){
        await page.evaluate(() => $('#activelySyncGtmDataLayer').click());
        await page.waitForTimeout(250);
        await page.waitForNetworkIdle();
        await capture.page(page, 'edit_url_without_activelySyncGtmDataLayer');
    });

    it('should enable edit button after changing a field', async function () {
        await page.goto(generalParamsSite1 + urlBase + '#?idContainer=aaacont2');
        await form.sendFieldValue(page, '.editContainer #name', 'My Updated Name');
        await createOrUpdateContainer();
        await capture.page(page, 'edit_url_updated');
    });

    it('should have updated the list of containers', async function () {
        await page.evaluate(() => $('.notification .close').click());
        await cancelContainer();
        await page.mouse.move(-10, -10);
        await capture.page(page, 'updated_back_to_list');
    });

    it('should be possible to open install code for container', async function () {
        await page.click('#containeraaacont1 .table-action.installCode');
        await page.waitForTimeout(250);
        await page.waitForNetworkIdle();
        await capture.modal(page, 'install_code_dialog');
    });

    it('should show dialog to copy container', async function () {
        await page.goto(generalParamsSite1 + urlBase);
        await page.click('#containeraaacont1 .table-action.icon-content-copy');
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyContainer');
        expect(await pageWrap.screenshot()).to.matchImage('copy_container_dialog');
    });

    it('should show list of sites to copy container to', async function () {
        await page.click('#destinationSite');
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyContainer');
        expect(await pageWrap.screenshot()).to.matchImage('copy_container_site_select');
    });

    it('should select site to copy container to', async function () {
        await page.evaluate(() => $('#destinationSite ul li:first').click());
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyContainer');
        expect(await pageWrap.screenshot()).to.matchImage('copy_container_site_selected');
    });

    it('should show confirm delete container dialog', async function () {
        await page.goto(generalParamsSite1 + urlBase);
        await page.click('#containeraaacont1 .table-action.icon-delete');
        await page.waitForTimeout(250);
        await capture.modal(page, 'confirm_delete_container');
    });

    it('should do nothing when selecting no', async function () {
        await modal.clickButton(page, 'No');
        await capture.page(page, 'confirm_delete_container_declined');
    });

    it('should delete container when confirmed', async function () {
        await page.click('#containeraaacont1 .table-action.icon-delete');
        await modal.clickButton(page, 'Yes');
        await page.waitForNetworkIdle();
        await capture.page(page, 'confirm_delete_container_confirmed');
    });

    it('should load a container page with no containers', async function () {
        await page.goto(generalParamsSite5 + urlBase);
        await capture.page(page, 'site_none_exist_yet');
    });

    it('should open create container page when clicking on create a container now link', async function () {
        await page.click('.createContainerNow');
        await capture.setTableRowHeight(page);
        pageWrap = await page.$('#content');
        expect(await pageWrap.screenshot()).to.matchImage('site_none_exist_yet_create_now');
    });

    it('should load container page with some containers as view user', async function () {
        permissions.setViewUser();
        await page.goto(generalParamsSite1 + urlBase);
        await capture.page(page, 'some_exist_view_user');
    });

    it('should load container page with no containers as view user', async function () {
        permissions.setViewUser();
        await page.goto(generalParamsSite5 + urlBase);
        await capture.page(page, 'none_exist_view_user');
    });

    it('should load container page with some containers as write user', async function () {
        permissions.setWriteUser();
        await page.goto(generalParamsSite1 + urlBase);
        await capture.page(page, 'some_exist_write_user');
    });
});
