//you may want to use a test database to check the correctness of the logic more easily

describe('dora app', function() {
	beforeEach(function(){
		browser.get('http://127.0.0.1:8000/dora');
		browser.waitForAngular();
	});
	
	it('should get the correct title', function(){
		expect(browser.getTitle()).toEqual('Dora - Iteration 2.5');
	});
	
	var inputBox = element(by.model('searchParam'));
	var suggestions = element(by.repeater('suggestion in suggestions').row(0));
	var key = element(by.binding('key'));
	var addFilterButton = element(by.css('#submitCriteria'));
	var submit = element(by.buttonText('Submit'));

	it('should submit a form and get results from the backend', function(){
		
		expect(addFilterButton.isEnabled()).toBe(false);
		expect(submit.isDisplayed()).toBe(false);
		
		inputBox.sendKeys('fever post surgical');
		suggestions.click();
		expect(key.getText()).toEqual('Fever post surgical procedure');
		
		expect(addFilterButton.isEnabled()).toBe(false);
		
		inputBox.sendKeys('yes');
		expect(addFilterButton.isEnabled()).toBe(true);
		
		addFilterButton.click();
		expect(submit.isDisplayed()).toBe(true);
		
		submit.click();
		
		expect(element.all(by.css('circle')).count()).toBe(4);
		element.all(by.css('circle')).each(function(circle){
			expect(circle.isPresent()).toBe(true);
		});
		
	});
	
	it('should save and load correctly', function(){
		var alias = element(by.binding('qrs.alias'));
		var inputAlias = element(by.model('qrs.alias'));
		
		inputBox.sendKeys('fever post surgical');
		suggestions.click();
		inputBox.sendKeys('yes');
		addFilterButton.click();
		submit.click();
		element.all(by.css('circle')).each(function(circle){
			expect(circle.isPresent()).toBe(true);
		});
		
		alias.click();
		inputAlias.clear();
		inputAlias.sendKeys('testInput');
		
		element(by.css('#saveButton')).click();
		element(by.css('#accountButton')).click();
		expect(element(by.cssContainingText('li', 'testInput')).isPresent()).toBe(true);
		
		element(by.css('#deleteButton')).click();
		element(by.cssContainingText('li', 'testInput')).click();
		expect(element.all(by.css('circle')).count()).toBe(4);
		element.all(by.css('circle')).each(function(circle){
			expect(circle.isPresent()).toBe(true);
		});
		
		element(by.css('li span.removeSavedQuery')).click();
	});
	
});