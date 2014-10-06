from dora.forms import QueryForm
from django.test import TestCase

class QueryFormTestCase(TestCase):
    """This test case tests primarily the correctness of those regex validators"""
    
    def test_query_form(self):
        form_data = {'disease': 'footrot',
                     'age_range': '2-5 , 3 - 4, 100 - 150  ',
                     'gender': 'm',
                     'location': 'GEOMETRYCOLLECTION(POINT (3.4 2.4))'}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['gender'], 'M')
        self.assertEqual(form.cleaned_data['age_range'], '2-5,3-4,100-150')
        
        form_data = {'disease': 'cough',
                     'age_range': '2  -5 ',
                     'gender': 'f',
                     'location': 'GEOMETRYCOLLECTION(POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10)))'}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['gender'], 'F')
        self.assertEqual(form.cleaned_data['age_range'], '2-5')
        
        #having no age_range is permitted
        form_data = {'disease': 'Pneumonia',
                     'gender': 'M',
                     'location': 'GEOMETRYCOLLECTION(MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),((15 5, 40 10, 10 20, 5 10, 15 5))))'}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['gender'], 'M')
        self.assertFalse(form.cleaned_data['age_range'])
        
        #having no gender or location is permitted
        form_data = {'disease': 'Influenza B',
                     'age_range': ' 3 - 4 , 4 -3 , 4 - 20 '}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertFalse(form.cleaned_data['gender'])
        self.assertEqual(form.cleaned_data['age_range'], '3-4,4-3,4-20')
        
        #empty strings for the optional filters are allowed
        form_data = {'disease': 'Influenza B',
                     'age_range': '',
                     'gender': '',
                     'location': ''}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertFalse(form.cleaned_data['gender'])
        self.assertFalse(form.cleaned_data['age_range'])
        
        #having no disease is not allowed
        form_data = {'age_range': ' 3 - 4 , 4 -3 , 4 - 20 ',
                     'gender': 'F',
                     'location': 'LINESTRING (30 10, 10 30, 40 40)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'disease': '',
                     'age_range': ' 3 - 4 , 4 -3 , 4 - 20 ',
                     'gender': 'F',
                     'location': 'LINESTRING (30 10, 10 30, 40 40)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        #having wrong gender is not allowed
        form_data = {'disease': 'Throat infection',
                     'age_range': ' 3 - 4 , 4 -3 , 4 - 20 ',
                     'gender': 'G',
                     'location': 'LINESTRING (30 10, 10 30, 40 40)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'disease': 'Hernia',
                     'age_range': ' 3 - 4 , 4 -3 , 4 - 20 ',
                     'gender': 'MF',
                     'location': 'LINESTRING (30 10, 10 30, 40 40)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'disease': 'Nose inflammation',
                     'age_range': ' 3 - 4 , 4 -3 , 4 - 20 ',
                     'gender': 'MF',
                     'location': 'LINESTRING (30 10, 10 30, 40 40)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        #wrong age_range
        form_data = {'disease': 'cough',
                     'age_range': '2  -5, ',
                     'gender': 'f',
                     'location': 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'disease': 'cough',
                     'age_range': '2  -5,  4',
                     'gender': 'f',
                     'location': 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        #wrong location
        form_data = {'disease': 'cough',
                     'age_range': '2  -5,  4 -3',
                     'gender': 'f',
                     'location': 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10)'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
