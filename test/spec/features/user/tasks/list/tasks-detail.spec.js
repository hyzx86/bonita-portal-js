'use strict';
/* jshint camelcase: false */

describe('module tasks.details', function() {

  var mockUser = {user_id:123, user_name:'test'};
  var mockTask =  {id:1, name:'task1', selected:true, processId: 42, type:'USER_TASK'} ;
  var mockCase = {
    id:77,
    state:'started',
    processDefinitionId: {
      version: '1.1.1',
      name: 'TastCase'
    }
  };

  var $httpBackend;
  var store;

  //var FORM_URL = 'http://form.url';

  beforeEach(module('org.bonitasoft.features.user.tasks.details'));
  beforeEach(module('org.bonitasoft.portalTemplates'));
  beforeEach(module('ui.bootstrap.tpls'));

  beforeEach(inject(function($injector){
    store = $injector.get('taskListStore');
    spyOn(store, 'user').and.returnValue(mockUser);

    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.whenGET(/portalTemplates\/user\/tasks\/list\/.*\.html/gi).respond('');
  }));

  describe('TaskDetailsHelper', function(){
    var service;
    var preference;

    beforeEach( inject(function( $injector) {
      preference = $injector.get('preference');


      spyOn(preference, 'get').and.returnValue('form');
      spyOn(preference, 'set');

      service = $injector.get('taskDetailsHelper');
    }));

    it('should retrieve lastUsed tab', function(){
      var scope = {
        tab: {
          context: false,
          form: false
        }
      };
      service.initTab(scope);
      expect(scope.tab.form).toEqual(true);
    });

    it('saveSelectedTab', function(){
      service.saveSelectedTab('toto');
      expect(preference.set).toHaveBeenCalledWith('lastTab', 'toto',  true);
    });

    describe('takeTask', function(){
      it('should make a put on HumanTask API', function() {
        $httpBackend.whenPUT(/^\.\.\/API\/bpm\/humanTask/).respond({assigned_id:123});
        $httpBackend.expectPUT(/^\.\.\/API\/bpm\/humanTask/);

        service.takeReleaseTask(mockTask);
        $httpBackend.flush();
        expect(mockTask.assigned_id).toBe(123);

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });
    });
  });

  describe('task-details directive', function(){
    var element;
    var scope;
    var iframe;
    var processAPI;
    var formMappingAPI;
    var $q;
    var FORM_URL = '/base/fixtures/form.html';

    beforeEach(inject(function($injector){
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      iframe = $injector.get('iframe');

      spyOn(iframe, 'getTaskForm').and.returnValue(FORM_URL);
      spyOn(iframe, 'getCaseOverview').and.returnValue(FORM_URL);

      // spy taskDetailHelper
      var taskDetailsHelper = $injector.get('taskDetailsHelper');
      spyOn(taskDetailsHelper, 'takeReleaseTask').and.callFake(function(){
        var deferred = $q.defer();
        deferred.resolve({assigned_id: mockUser.user_id});
        return deferred.promise;
      });
    }));

    beforeEach(inject(function($compile, $rootScope, $document, $injector){
      scope = $rootScope.$new();

      processAPI = $injector.get('processAPI');
      spyOn(processAPI,'get').and.callFake(function(){
        var deferred = $q.defer();
        deferred.resolve({id: 42});
        return {
          $promise: deferred.promise
        };
      });
      formMappingAPI = $injector.get('formMappingAPI');
      spyOn(formMappingAPI,'search').and.callFake(function(){
        var deferred = $q.defer();
        deferred.resolve({resource: {0: {target: 'INTERNAL'}, pagination: {total: 1}}});
        return {
          $promise: deferred.promise
        };
      });

      scope.currentCase = mockCase;
      scope.currentTask = mockTask;
      scope.inactive = false;
      scope.editable = true;
      scope.refreshCountHandler = jasmine.createSpy('refresh');
      scope.hideFormHandler = jasmine.createSpy('hideForm');

      var markup =
        '  <task-details current-task="currentTask"' +
        '        current-case="currentCase"' +
        '        refresh="refreshCountHandler()"' +
        '        editable="editable"' +
        '        hide-form="hideFormHandler()"' +
        '        inactive="inactive">' +
        '  </task-details>';


      element = $compile(markup)(scope);

      // use to ensure iframe dom loading
      $document.find('body').append(element);
      scope.$digest();
    }));

    it('should getProcess', function(){

      element.isolateScope();

      expect(processAPI.get).toHaveBeenCalledWith({id: 42});
    });

    it('should remove children when tab is inactive', function(){
      var contextTab = element[0].querySelectorAll('.tab-pane.active');

      expect(contextTab[0].children.length).toBe(1);

      scope.inactive = true;
      scope.$digest();
      expect(contextTab[0].children.length).toBe(0);
    });

    it('should update formUrl', function(){

      var isolatedScope = element.isolateScope();

      expect(isolatedScope.formUrl).toBe(FORM_URL);
    });

  });
});