from mds.dora.forms import QueryForm
from django.test import TestCase

class QueryFormTestCase(TestCase):
    """This test case tests primarily the correctness of those regex validators since the rest are CharFields"""
    
    def test_query_form(self):
        form_data = {'age_range': '2-5 , 3 - 4, 100 - 150  '}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['age_range'], '2-5,3-4,100-150')
        
        form_data = {'age_range': '2  -5, 5-10 '}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['age_range'], '2-5,5-10')
        
        form_data = {'age_range': ' 3 - 4 , 4 -3 , 4 - 20 '}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['age_range'], '3-4,4-3,4-20')
        
        form_data = {'age_range': '2  -5 , 3- 4 '}
        form = QueryForm(form_data)
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['age_range'], '2-5,3-4')
        
        form_data = {'age_range': '2  -5 ,'}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'age_range': '2 , -5 '}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
        
        form_data = {'age_range': '2  -5,, '}
        form = QueryForm(form_data)
        self.assertFalse(form.is_valid())
