/*!
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */
describe("ContainerTrigger", function () {
    this.timeout(0);

    this.fixture = "Piwik\\Plugins\\TagManager\\tests\\Fixtures\\TagManagerFixture";
    this.optionsOverride = {
        'persist-fixture-data': false
    };

    var generalParamsSite1 = '?idSite=2&period=day&date=2010-01-03',
        generalParamsSite5 = '?idSite=5&period=day&date=2010-01-03',
        urlBase = '&module=TagManager&action=manageTriggers',
    container1Base = generalParamsSite1 + urlBase + '&idContainer=aaacont1',
    container3Base = generalParamsSite1 + urlBase + '&idContainer=aaacont3';

    var permissions = require("./permissions");
    var form = require("./form");
    var capture = require("./capture");
    var modal = require("./modal");

    before(function () {
        testEnvironment.pluginsToLoad = ['TagManager'];
        testEnvironment.save();
    });

    afterEach(function () {
        permissions.resetUser();
        testEnvironment.testUseMockAuth = 1;
        testEnvironment.save();
    });

    async function selectTriggerType(triggerType)
    {
        await page.click('.editTrigger .collection-item.templateType' + triggerType);
    }

    async function setTriggerName(name, prefix)
    {
        if (!prefix) {
            prefix = '';
        } else {
            prefix += ' ';
        }
        await form.sendFieldValue(page, prefix + '.editTrigger [id=name]', name);
    }

    async function setParameterValue(triggerName, value)
    {
        await form.sendFieldValue(page, '.editTrigger [id=' + triggerName + ']', value);
    }

    async function clickFirstRowTableAction(action, rowIndex)
    {
        if (!rowIndex) {
            rowIndex = 3;
        }
        const selector = '.tagManagerTriggerList .entityTable tbody tr:nth-child(' + rowIndex + ') .table-action.' + action;
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector);
    }

    async function createOrUpdateTrigger()
    {
        await page.click('.editTrigger .createButton');
        await page.waitForNetworkIdle();
    }

    async function cancelTrigger()
    {
        await page.click('.editTrigger .entityCancel a');
    }

    async function searchTrigger(searchTerm)
    {
        await page.focus('#triggerSearch');
        await page.evaluate((searchTerm) => {
          var search = document.getElementById('triggerSearch');
          search.value = searchTerm;
          var event = new Event('change');
          search.dispatchEvent(event);
        }, searchTerm);
        await page.waitForTimeout(200);
    }

    it('should load triggers page with some triggers', async function () {
        await page.goto(container1Base);
        await page.waitForTimeout(1000);
        await capture.page(page, 'trigger_some_exist');
    });

    it('should be able to search triggers by name', async function () {
        await searchTrigger('My Trigger1');
        await capture.page(page, 'trigger_search_name');
    });

    it('should be able to search triggers by description', async function () {
        await searchTrigger('My Trigger1 description setting');
        await capture.page(page, 'trigger_search_description');
    });

    it('should be able to search triggers by type', async function () {
        await searchTrigger('custom event');
        await capture.page(page, 'trigger_search_type');
    });

    it('should be able to search by custom event name', async function () {
        await searchTrigger('foo');
        await capture.page(page, 'trigger_search_custom_event_name');
    });

    it('should be able to search triggers by value not present', async function () {
        await searchTrigger('shjdkfk');
        await capture.page(page, 'trigger_search_empty_result');
    });

    it('should be able to create a new trigger and show list of available types', async function () {
        await page.click('.createNewTrigger');
        await page.waitForNetworkIdle();
        await capture.page(page, 'create_new');
    });

    it('should be able to select a type and then show create trigger screen', async function () {
        await selectTriggerType('ElementVisibility');
        await capture.page(page, 'create_new_type_selected');
    });

    it('should show an error when not possible to create trigger', async function () {
        await createOrUpdateTrigger();
        await capture.page(page, 'create_new_error');
    });

    it('should show list of available variables with description tooltips', async function () {
        await page.goto(container1Base);
        await page.click('.createNewTrigger');
        await page.waitForNetworkIdle();
        await selectTriggerType('DomReady');
        await page.click('div.condition0 div.expandableSelector');
        await page.click('ul.firstLevel > li.collection-item:first-child');
        await capture.page(page, 'select_variable_filter');
    });

    it('should be able to prefill trigger', async function () {
        await page.goto(container1Base);
        await page.click('.createNewTrigger');
        await page.waitForNetworkIdle();
        await selectTriggerType('ElementVisibility');
        await setParameterValue('elementId', 'myElementId');
        await capture.page(page, 'create_new_prefilled');
    });

    it('should be able to create a new trigger and show update afterwards', async function () {
        await createOrUpdateTrigger();
      await page.waitForTimeout(250);
        await capture.page(page, 'create_new_shown_in_list');
    });

    it('should be possible to edit a trigger by clicking on edit', async function () {
        await clickFirstRowTableAction('icon-edit');
        await page.waitForNetworkIdle();
        await page.waitForTimeout(250);
        await capture.page(page, 'edit_through_list');
    });

    it('should load an edit trigger through URL', async function () {
        await page.goto('about:blank'); // hashchange won't trigger a new page load
        await page.goto(container1Base + '#?idTrigger=2');
        await capture.page(page, 'edit_url');
    });

    it('should enable edit button after changing a field', async function () {
        await setTriggerName('triggerNameNew');
        await capture.page(page, 'edit_url_updated');
    });

    it('should have updated the list of triggers', async function () {
        await createOrUpdateTrigger();
        await capture.page(page, 'edit_updated_back_to_list');
    });

    it('should show confirm delete trigger dialog_shows_warning_cannot_be_deleted', async function () {
        await page.goto(container1Base);
        await clickFirstRowTableAction('icon-delete', 4);
        await capture.modal(page, 'confirm_delete_trigger_warning_referenced');
    });

    it('should show confirm delete trigger dialog', async function () {
        await page.goto(container1Base);
        await clickFirstRowTableAction('icon-delete', 3);
        await capture.modal(page, 'confirm_delete_trigger');
    });

    it('should do nothing when selecting no', async function () {
        await modal.clickButton(page, 'No');
        await capture.page(page, 'confirm_delete_trigger_declined');
    });

    it('should delete trigger when confirmed', async function () {
        await clickFirstRowTableAction('icon-delete', 3);
        await page.waitForTimeout(250);
        await modal.clickButton(page, 'Yes');
        await page.waitForNetworkIdle();
        await capture.page(page, 'confirm_delete_trigger_confirmed');
    });

    it('should load triggers page with no triggers as view user', async function () {
        permissions.setViewUser();
        await page.goto(container3Base);
        await capture.page(page, 'trigger_none_exist_view_user');
    });

    it('should load a triggers page with no triggers', async function () {
        await page.goto(container3Base);
        await capture.page(page, 'trigger_none_exist_yet');
    });

    it('should open create trigger page when clicking on create a trigger now link', async function () {
        await page.click('.createContainerTriggerNow');
        await page.mouse.move(-10, -10);
        await page.waitForNetworkIdle();
        await page.waitForTimeout(200);
        await capture.page(page, 'trigger_none_exist_yet_create_now');
    });

    it('should be possible to create a trigger with a conditions filter', async function () {
        await selectTriggerType('ElementVisibility');
        await setParameterValue('elementId', 'myelementid');
        await form.sendFieldValue(page, '.editTrigger .condition0 [id=condition_expected]', 'elementIdFoo');
        await form.sendFieldValue(page, '.editTrigger .condition1 [id=condition_expected]', 'elementIdBar');
        await capture.page(page, 'create_advanced_prefilled');
    });

    it('should be possible to create a trigger with conditions filter', async function () {
        await createOrUpdateTrigger();
        await capture.page(page, 'create_advanced_verified');
    });

    it('should load triggers page with some triggers as view user', async function () {
        permissions.setViewUser();
        await page.goto(container1Base);
        await page.waitForTimeout(1000);
        await capture.page(page, 'trigger_some_exist_view_user');
    });

    it('should be able to create new trigger with really long name', async function () {
        await page.goto(container1Base);
        await page.click('.createNewTrigger');
        await page.waitForNetworkIdle();
        await selectTriggerType('ElementVisibility');
        await setParameterValue('elementId', 'myElementId');
        await setParameterValue('name', 'Test trigger with a really long name. Abcdefghijklmnopqrstuvwxyz1234567890Abcdefghijklmnopqrstuvwxyz1234567890Abcdefghijklmnopqrstuvwxyz1234567890Abcdefghijklmnopqrstuvwxyz1234567890Abcdefghijklmnopqrstuvwxyz1234567890Abcdefghijklmnopqrstuvwxyz1234567890A');
        await createOrUpdateTrigger();
        await page.waitForTimeout(250);
        await capture.page(page, 'create_new_long_name');
    });

    it('should show dialog to copy trigger', async function () {
        await page.goto(container1Base);
        await clickFirstRowTableAction('icon-content-copy', 3);
        await page.waitForNetworkIdle();
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyTrigger');
        expect(await pageWrap.screenshot()).to.matchImage('copy_trigger_dialog');
    });

    it('should select container to copy trigger to', async function () {
        await page.evaluate(() => $('div.matomo-field-select div.select-wrapper input.dropdown-trigger')[0].click());
        await page.waitForTimeout(250);
        await page.evaluate(() => $('div.matomo-field-select ul li:first').click());
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyTrigger');
        expect(await pageWrap.screenshot()).to.matchImage('copy_trigger_container_selected');
    });

    it('should show list of sites to copy trigger to', async function () {
        await page.click('#destinationSite');
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyTrigger');
        expect(await pageWrap.screenshot()).to.matchImage('copy_trigger_site_select');
    });

    it('should select site to copy trigger to', async function () {
        await page.evaluate(() => $('#destinationSite ul li:first').click());
        await page.waitForTimeout(250);
        pageWrap = await page.waitForSelector('div.ui-dialog.mtmCopyTrigger');
        expect(await pageWrap.screenshot()).to.matchImage('copy_trigger_site_selected');
    });

    it('should be able to copy trigger', async function () {
        await page.goto(container1Base);
        await clickFirstRowTableAction('icon-content-copy', 3);
        await page.waitForNetworkIdle();
        await page.evaluate(() => $('div.copyMtmObjectDialog button.btn').click());
        await page.waitForNetworkIdle();
        await capture.page(page, 'copy_trigger_success');
    });

    it('should hide copy success notification after deleting trigger', async function () {
        await clickFirstRowTableAction('icon-delete', 4);
        await page.waitForNetworkIdle();
        await modal.clickButton(page, 'Yes');
        await page.waitForNetworkIdle();
        await capture.page(page, 'copy_trigger_success_hidden');
    });

    it('should show list of containers to copy trigger to', async function () {
        await page.goto(container1Base);
        await clickFirstRowTableAction('icon-content-copy', 3);
        await page.waitForNetworkIdle();
        // Reverse testing specific CSS preventing dropdown from overflowing the modal like usual
        await page.evaluate(function() {
          var style = document.createElement('style');
          style.appendChild(document.createTextNode(`div.ui-dialog.mtmCopyTrigger div#Piwik_Popover { overflow-y: unset !important; }`));
          document.body.appendChild(style);
        });
        await page.evaluate(() => $('div.matomo-field-select div.select-wrapper input.dropdown-trigger')[0].click());
        await page.waitForTimeout(250);
        await capture.page(page, 'copy_trigger_container_select');
    });
});
